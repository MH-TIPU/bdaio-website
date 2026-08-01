"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import {
  logActivity,
  requireModeratorOf,
  requireRole,
  requireUser,
} from "@/lib/auth/dal";
import { grantBadge, revokeBadge, roleBadgeType } from "@/lib/community/badges";
import { notify } from "@/lib/notifications/notify";
import { consumeRateLimit, retryAfterMessage } from "@/lib/security/rateLimit";
import { fieldErrors, slugify } from "@/lib/validation/admin";
import { isValidLocation } from "@/data/bd-geo";
import {
  communityRoleSchema,
  contributionSchema,
  institutionSchema,
  joinInstitutionSchema,
  type CommunityFormState,
} from "@/lib/validation/community";

// --- Institution registration (self-service, admin-gated) -------------------

/**
 * Anyone with an account may propose an institution, but it stays PENDING and
 * invisible until an admin approves it — and only then does the registrant
 * become its moderator. This is the gate that stops fake institutions from
 * minting "verified" students.
 */
export async function registerInstitution(
  _prev: CommunityFormState,
  formData: FormData,
): Promise<CommunityFormState> {
  const user = await requireUser();

  if (!user.emailVerifiedAt) {
    return { message: "Verify your email address before registering an institution." };
  }

  // A verified account is the gate, but one account should not be able to bury
  // the admin approval queue in submissions.
  const throttle = await consumeRateLimit({
    bucket: `institution_register:user:${user.id}`,
    limit: 3,
    windowMs: 60 * 60_000,
  });
  if (!throttle.ok) {
    return { message: retryAfterMessage(throttle.retryAfterSeconds) };
  }

  const raw = Object.fromEntries(formData.entries());
  const parsed = institutionSchema.safeParse(raw);
  if (!parsed.success) return { errors: fieldErrors(parsed.error) };

  const data = parsed.data;

  // Reject a crafted division/district/upazila combination that doesn't exist.
  if (
    !isValidLocation({
      division: data.division,
      district: data.district,
      upazila: data.upazila,
    })
  ) {
    return {
      errors: { district: ["Choose a valid division, district, and sub-district."] },
    };
  }

  const slug = data.slug ?? slugify(data.name);

  if (await db.institution.findUnique({ where: { slug }, select: { id: true } })) {
    return {
      errors: { name: ["An institution with a similar name is already registered."] },
    };
  }

  const institution = await db.institution.create({
    data: {
      name: data.name,
      nameBn: data.nameBn ?? null,
      slug,
      type: data.type,
      division: data.division ?? null,
      district: data.district ?? null,
      upazila: data.upazila ?? null,
      description: data.description ?? null,
      website: data.website ?? null,
      status: "PENDING", // never live on creation
      verified: false,
      memberships: {
        create: {
          userId: user.id,
          membershipRole: "MODERATOR",
          status: "PENDING", // becomes APPROVED when the institution is approved
        },
      },
    },
  });

  await logActivity({
    userId: user.id,
    action: "institution.registered",
    entityType: "Institution",
    entityId: institution.id,
    metadata: { slug },
  });

  revalidatePath("/institutions");
  redirect("/dashboard/institution?submitted=1");
}

/** Admin decision on a proposed institution. Approval installs its moderators. */
export async function decideInstitution(formData: FormData): Promise<void> {
  const admin = await requireRole("ADMIN");
  const id = String(formData.get("institutionId") ?? "");
  const decision = String(formData.get("decision") ?? "");
  // InstitutionStatus has no REJECTED: a refused or withdrawn institution is
  // SUSPENDED, which keeps it out of every public query.
  if (!["APPROVED", "SUSPENDED"].includes(decision)) return;

  const institution = await db.institution.findUnique({
    where: { id },
    select: { id: true, slug: true },
  });
  if (!institution) return;

  await db.institution.update({
    where: { id },
    data: {
      status: decision as "APPROVED" | "SUSPENDED",
      // Admin approval is also what marks the organisation itself verified.
      verified: decision === "APPROVED",
    },
  });

  if (decision === "APPROVED") {
    // Pending moderators become active only now.
    await db.institutionMembership.updateMany({
      where: { institutionId: id, membershipRole: "MODERATOR", status: "PENDING" },
      data: { status: "APPROVED" },
    });

    const moderators = await db.institutionMembership.findMany({
      where: { institutionId: id, membershipRole: "MODERATOR", status: "APPROVED" },
      select: { userId: true },
    });

    // Promote each moderator's account role, but never demote an admin.
    for (const m of moderators) {
      await db.user.updateMany({
        where: { id: m.userId, role: "PARTICIPANT" },
        data: { role: "INSTITUTION_MODERATOR" },
      });
    }
  }

  await logActivity({
    userId: admin.id,
    action: `admin.institution.${decision.toLowerCase()}`,
    entityType: "Institution",
    entityId: id,
  });

  revalidatePath("/admin/institutions");
  revalidatePath("/institutions");
  revalidatePath(`/institutions/${institution.slug}`);
}

// --- Membership (join request → moderator review → verification) ------------

export async function requestMembership(
  _prev: CommunityFormState,
  formData: FormData,
): Promise<CommunityFormState> {
  const user = await requireUser();

  const parsed = joinInstitutionSchema.safeParse(
    Object.fromEntries(formData.entries()),
  );
  if (!parsed.success) return { errors: fieldErrors(parsed.error) };
  const data = parsed.data;

  const institution = await db.institution.findFirst({
    where: { id: data.institutionId, status: "APPROVED" },
    select: { id: true },
  });
  if (!institution) {
    return { errors: { institutionId: ["That institution is not available."] } };
  }

  const existing = await db.institutionMembership.findFirst({
    where: { userId: user.id, institutionId: institution.id },
    select: { id: true, status: true },
  });
  if (existing) {
    return {
      message:
        existing.status === "PENDING"
          ? "Your request is already awaiting review."
          : "You are already linked to this institution.",
    };
  }

  await db.institutionMembership.create({
    data: {
      userId: user.id,
      institutionId: institution.id,
      membershipRole: data.membershipRole,
      status: "PENDING",
      note: data.note ?? null,
    },
  });

  await logActivity({
    userId: user.id,
    action: "membership.requested",
    entityType: "Institution",
    entityId: institution.id,
  });

  revalidatePath("/dashboard/institution");
  return { success: true, message: "Request sent — a moderator will review it." };
}

/** Moderator (or admin) decides on a join request for their own institution. */
export async function decideMembership(formData: FormData): Promise<void> {
  const membershipId = String(formData.get("membershipId") ?? "");
  const decision = String(formData.get("decision") ?? "");
  if (!["APPROVED", "REJECTED"].includes(decision)) return;

  const membership = await db.institutionMembership.findUnique({
    where: { id: membershipId },
    select: { id: true, institutionId: true, userId: true, membershipRole: true },
  });
  if (!membership) return;

  // Scoped authorization: only this institution's moderator, or an admin.
  const actor = await requireModeratorOf(membership.institutionId);

  await db.institutionMembership.update({
    where: { id: membership.id },
    data: {
      status: decision as "APPROVED" | "REJECTED",
      // Rejecting also clears any verification that had been granted.
      ...(decision === "REJECTED"
        ? { verified: false, verifiedById: null, verifiedAt: null }
        : {}),
    },
  });

  if (decision === "REJECTED") {
    await revokeBadge(membership.userId, "VERIFIED_STUDENT");
  }

  await logActivity({
    userId: actor.id,
    action: `membership.${decision.toLowerCase()}`,
    entityType: "InstitutionMembership",
    entityId: membership.id,
    metadata: { subject: membership.userId },
  });

  revalidatePath("/dashboard/institution");
}

/**
 * The verification step: a moderator confirms this person really belongs to
 * their institution, which grants the Verified Student badge.
 */
export async function setMembershipVerified(formData: FormData): Promise<void> {
  const membershipId = String(formData.get("membershipId") ?? "");
  const verified = String(formData.get("verified") ?? "") === "1";

  const membership = await db.institutionMembership.findUnique({
    where: { id: membershipId },
    select: { id: true, institutionId: true, userId: true, status: true },
  });
  if (!membership) return;

  const actor = await requireModeratorOf(membership.institutionId);

  // Only an approved membership can be verified.
  if (membership.status !== "APPROVED") return;

  // A moderator must never be able to verify their own membership.
  if (membership.userId === actor.id && actor.role === "INSTITUTION_MODERATOR") {
    return;
  }

  await db.institutionMembership.update({
    where: { id: membership.id },
    data: {
      verified,
      verifiedById: verified ? actor.id : null,
      verifiedAt: verified ? new Date() : null,
    },
  });

  if (verified) {
    await grantBadge(membership.userId, "VERIFIED_STUDENT");
    await notify({
      userId: membership.userId,
      type: "membership.verified",
      title: "You are now a verified student",
      body: "Your institution confirmed your membership — the badge is on your profile.",
      href: "/dashboard/achievements",
    });
  } else {
    await revokeBadge(membership.userId, "VERIFIED_STUDENT");
  }

  await logActivity({
    userId: actor.id,
    action: verified ? "membership.verified" : "membership.unverified",
    entityType: "InstitutionMembership",
    entityId: membership.id,
    metadata: { subject: membership.userId },
  });

  revalidatePath("/dashboard/institution");
}

// --- Community roles -------------------------------------------------------

export async function applyForCommunityRole(
  _prev: CommunityFormState,
  formData: FormData,
): Promise<CommunityFormState> {
  const user = await requireUser();

  if (!user.emailVerifiedAt) {
    return { message: "Verify your email address before applying." };
  }

  const parsed = communityRoleSchema.safeParse(
    Object.fromEntries(formData.entries()),
  );
  if (!parsed.success) return { errors: fieldErrors(parsed.error) };
  const data = parsed.data;

  // An institution-scoped application requires an approved membership there.
  if (data.institutionId) {
    const membership = await db.institutionMembership.findFirst({
      where: {
        userId: user.id,
        institutionId: data.institutionId,
        status: "APPROVED",
      },
      select: { id: true },
    });
    if (!membership) {
      return {
        errors: {
          institutionId: ["Join and be approved by that institution first."],
        },
      };
    }
  }

  const existing = await db.communityRole.findFirst({
    where: {
      userId: user.id,
      type: data.type,
      institutionId: data.institutionId ?? null,
    },
    select: { status: true },
  });
  if (existing) {
    return {
      message:
        existing.status === "PENDING"
          ? "That application is already under review."
          : "You already hold that role.",
    };
  }

  await db.communityRole.create({
    data: {
      userId: user.id,
      type: data.type,
      institutionId: data.institutionId ?? null,
      motivation: data.motivation,
      status: "PENDING",
    },
  });

  await logActivity({
    userId: user.id,
    action: "community_role.applied",
    entityType: "CommunityRole",
    metadata: { type: data.type, scope: data.institutionId ?? "GLOBAL" },
  });

  revalidatePath("/dashboard/roles");
  return { success: true, message: "Application submitted for review." };
}

/** Global applications are decided by admins; scoped ones by the moderator. */
export async function decideCommunityRole(formData: FormData): Promise<void> {
  const roleId = String(formData.get("roleId") ?? "");
  const decision = String(formData.get("decision") ?? "");
  if (!["APPROVED", "REJECTED"].includes(decision)) return;

  const application = await db.communityRole.findUnique({
    where: { id: roleId },
    select: { id: true, userId: true, type: true, institutionId: true },
  });
  if (!application) return;

  const actor = application.institutionId
    ? await requireModeratorOf(application.institutionId)
    : await requireRole("ADMIN");

  await db.communityRole.update({
    where: { id: application.id },
    data: {
      status: decision as "APPROVED" | "REJECTED",
      approvedById: decision === "APPROVED" ? actor.id : null,
      since: decision === "APPROVED" ? new Date() : null,
    },
  });

  const badge = roleBadgeType(application.type);
  if (decision === "APPROVED") {
    await grantBadge(application.userId, badge);
    await notify({
      userId: application.userId,
      type: "community_role.approved",
      title: `You are now a BdAIO ${application.type.toLowerCase()}`,
      body: "You can record your contributions from your dashboard.",
      href: "/dashboard/contributions",
    });
  } else {
    // Only drop the badge if no other approved grant of this role remains.
    const stillHeld = await db.communityRole.count({
      where: {
        userId: application.userId,
        type: application.type,
        status: "APPROVED",
        id: { not: application.id },
      },
    });
    if (stillHeld === 0) await revokeBadge(application.userId, badge);
  }

  await logActivity({
    userId: actor.id,
    action: `community_role.${decision.toLowerCase()}`,
    entityType: "CommunityRole",
    entityId: application.id,
    metadata: { subject: application.userId, type: application.type },
  });

  revalidatePath("/admin/community");
  revalidatePath("/dashboard/roles");
  revalidatePath("/dashboard/institution");
}

// --- Contributions ---------------------------------------------------------

export async function logContribution(
  _prev: CommunityFormState,
  formData: FormData,
): Promise<CommunityFormState> {
  const user = await requireUser();

  const parsed = contributionSchema.safeParse(
    Object.fromEntries(formData.entries()),
  );
  if (!parsed.success) return { errors: fieldErrors(parsed.error) };
  const data = parsed.data;

  // Contributions are only for people the community has actually recognised.
  const hasRole = await db.communityRole.count({
    where: { userId: user.id, status: "APPROVED" },
  });
  if (hasRole === 0) {
    return {
      message:
        "Contributions can be recorded once you hold an approved volunteer, mentor, or contributor role.",
    };
  }

  if (data.eventId) {
    const event = await db.event.findUnique({
      where: { id: data.eventId },
      select: { id: true },
    });
    if (!event) return { errors: { eventId: ["Choose a valid event."] } };
  }

  await db.contribution.create({
    data: {
      userId: user.id,
      kind: data.kind,
      title: data.title,
      description: data.description ?? null,
      eventId: data.eventId ?? null,
      occurredOn: data.occurredOn ? new Date(data.occurredOn) : null,
      hours: data.hours ? Number(data.hours) : null,
    },
  });

  await logActivity({
    userId: user.id,
    action: "contribution.logged",
    entityType: "Contribution",
  });

  revalidatePath("/dashboard/contributions");
  return { success: true, message: "Contribution recorded." };
}

export async function deleteContribution(formData: FormData): Promise<void> {
  const user = await requireUser();
  const id = String(formData.get("contributionId") ?? "");

  // Owner-scoped: nobody can delete another person's record.
  const contribution = await db.contribution.findFirst({
    where: { id, userId: user.id },
    select: { id: true },
  });
  if (!contribution) return;

  await db.contribution.delete({ where: { id: contribution.id } });
  revalidatePath("/dashboard/contributions");
}
