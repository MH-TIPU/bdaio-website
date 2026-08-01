"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { logActivity, requireRole } from "@/lib/auth/dal";
import { appUrl, sendMail } from "@/lib/email/mailer";
import { registrationDecisionEmail } from "@/lib/email/templates";
import { notify } from "@/lib/notifications/notify";
import {
  eventSchema,
  fieldErrors,
  programSchema,
  roundSchema,
  slugify,
  type AdminFormState,
} from "@/lib/validation/admin";

// Every action re-checks the caller's role server-side; the admin layout guard
// is convenience, not security.

function refreshPublicViews() {
  revalidatePath("/programs");
  revalidatePath("/events");
  revalidatePath("/workshops");
}

// --- Programs --------------------------------------------------------------

export async function saveProgram(
  _prev: AdminFormState,
  formData: FormData,
): Promise<AdminFormState> {
  const admin = await requireRole("ADMIN");
  const id = String(formData.get("id") ?? "") || null;

  const raw = Object.fromEntries(formData.entries());
  const parsed = programSchema.safeParse({
    ...raw,
    slug: String(raw.slug || "").trim() || slugify(String(raw.title ?? "")),
    isExternal: formData.get("isExternal") === "on",
    active: formData.get("active") === "on",
  });

  if (!parsed.success) return { errors: fieldErrors(parsed.error) };
  const data = parsed.data;

  const clash = await db.program.findFirst({
    where: { slug: data.slug, ...(id ? { id: { not: id } } : {}) },
    select: { id: true },
  });
  if (clash) return { errors: { slug: ["That slug is already in use."] } };

  const program = id
    ? await db.program.update({ where: { id }, data })
    : await db.program.create({ data });

  await logActivity({
    userId: admin.id,
    action: id ? "admin.program.updated" : "admin.program.created",
    entityType: "Program",
    entityId: program.id,
  });

  refreshPublicViews();
  revalidatePath(`/programs/${program.slug}`);
  redirect("/admin/programs");
}

// --- Events ----------------------------------------------------------------

export async function saveEvent(
  _prev: AdminFormState,
  formData: FormData,
): Promise<AdminFormState> {
  const admin = await requireRole("ADMIN");
  const id = String(formData.get("id") ?? "") || null;

  const raw = Object.fromEntries(formData.entries());
  const parsed = eventSchema.safeParse({
    ...raw,
    slug: String(raw.slug || "").trim() || slugify(String(raw.title ?? "")),
  });

  if (!parsed.success) return { errors: fieldErrors(parsed.error) };
  const data = parsed.data;

  const clash = await db.event.findFirst({
    where: { slug: data.slug, ...(id ? { id: { not: id } } : {}) },
    select: { id: true },
  });
  if (clash) return { errors: { slug: ["That slug is already in use."] } };

  // `undefined` means "leave alone" in Prisma, but these fields are clearable,
  // so map missing optional values explicitly to null on update.
  const payload = {
    ...data,
    titleBn: data.titleBn ?? null,
    description: data.description ?? null,
    venue: data.venue ?? null,
    onlineUrl: data.onlineUrl ?? null,
    capacity: data.capacity ?? null,
    feeBdt: data.feeBdt ?? null,
    startsAt: data.startsAt ?? null,
    endsAt: data.endsAt ?? null,
    regOpensAt: data.regOpensAt ?? null,
    regClosesAt: data.regClosesAt ?? null,
  };

  const event = id
    ? await db.event.update({ where: { id }, data: payload })
    : await db.event.create({ data: payload });

  await logActivity({
    userId: admin.id,
    action: id ? "admin.event.updated" : "admin.event.created",
    entityType: "Event",
    entityId: event.id,
  });

  refreshPublicViews();
  revalidatePath(`/events/${event.slug}`);
  redirect("/admin/events");
}

/** Copies an edition (and its rounds) as a draft for the following year. */
export async function cloneEvent(formData: FormData): Promise<void> {
  const admin = await requireRole("ADMIN");
  const id = String(formData.get("id") ?? "");

  const source = await db.event.findUnique({
    where: { id },
    include: { rounds: { orderBy: { order: "asc" } } },
  });
  if (!source) return;

  const year = source.year + 1;
  let slug = `${source.slug.replace(/-?\d{4}$/, "")}-${year}`;
  if (await db.event.findUnique({ where: { slug }, select: { id: true } })) {
    slug = `${slug}-copy`;
  }

  const clone = await db.event.create({
    data: {
      programId: source.programId,
      title: source.title.replace(/\d{4}/, String(year)) || `${source.title} ${year}`,
      titleBn: source.titleBn,
      slug,
      type: source.type,
      year,
      description: source.description,
      mode: source.mode,
      venue: source.venue,
      capacity: source.capacity,
      feeBdt: source.feeBdt,
      status: "DRAFT", // never publish a clone by accident
      rounds: {
        create: source.rounds.map((r) => ({
          name: r.name,
          order: r.order,
          mode: r.mode,
          venue: r.venue,
        })),
      },
    },
  });

  await logActivity({
    userId: admin.id,
    action: "admin.event.cloned",
    entityType: "Event",
    entityId: clone.id,
    metadata: { from: source.slug, to: clone.slug },
  });

  revalidatePath("/admin/events");
  redirect(`/admin/events/${clone.id}`);
}

// --- Rounds ----------------------------------------------------------------

export async function saveRound(
  _prev: AdminFormState,
  formData: FormData,
): Promise<AdminFormState> {
  const admin = await requireRole("ADMIN");
  const id = String(formData.get("id") ?? "") || null;

  const parsed = roundSchema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) return { errors: fieldErrors(parsed.error) };
  const data = parsed.data;

  const event = await db.event.findUnique({
    where: { id: data.eventId },
    select: { id: true, slug: true },
  });
  if (!event) return { message: "That event no longer exists." };

  const payload = {
    ...data,
    venue: data.venue ?? null,
    onlineUrl: data.onlineUrl ?? null,
    startsAt: data.startsAt ?? null,
    endsAt: data.endsAt ?? null,
    regOpensAt: data.regOpensAt ?? null,
    regClosesAt: data.regClosesAt ?? null,
  };

  const round = id
    ? await db.round.update({ where: { id }, data: payload })
    : await db.round.create({ data: payload });

  await logActivity({
    userId: admin.id,
    action: id ? "admin.round.updated" : "admin.round.created",
    entityType: "Round",
    entityId: round.id,
  });

  revalidatePath(`/admin/events/${event.id}/rounds`);
  revalidatePath(`/events/${event.slug}`);
  return { success: true, message: "Round saved." };
}

export async function deleteRound(formData: FormData): Promise<void> {
  const admin = await requireRole("ADMIN");
  const id = String(formData.get("id") ?? "");

  const round = await db.round.findUnique({
    where: { id },
    include: { _count: { select: { registrations: true } }, event: true },
  });
  if (!round) return;

  // Refuse to delete a round people have entered — withdraw them first.
  if (round._count.registrations > 0) return;

  await db.round.delete({ where: { id } });
  await logActivity({
    userId: admin.id,
    action: "admin.round.deleted",
    entityType: "Round",
    entityId: id,
  });

  revalidatePath(`/admin/events/${round.eventId}/rounds`);
  revalidatePath(`/events/${round.event.slug}`);
}

// --- Registrations ---------------------------------------------------------

export async function decideRegistration(formData: FormData): Promise<void> {
  const admin = await requireRole("ADMIN");
  const id = String(formData.get("registrationId") ?? "");
  const decision = String(formData.get("decision") ?? "");

  if (!["APPROVED", "REJECTED", "WAITLISTED", "APPLIED"].includes(decision)) return;

  const registration = await db.registration.findUnique({
    where: { id },
    include: {
      user: { select: { id: true, email: true } },
      event: { select: { title: true, slug: true } },
      round: { select: { name: true } },
    },
  });
  if (!registration) return;

  await db.registration.update({
    where: { id },
    data: { status: decision as "APPROVED" | "REJECTED" | "WAITLISTED" | "APPLIED" },
  });

  await logActivity({
    userId: admin.id,
    action: "admin.registration.decided",
    entityType: "Registration",
    entityId: id,
    metadata: { decision, event: registration.event.slug },
  });

  // Only the outcomes a participant needs to act on trigger mail.
  if (decision === "APPROVED" || decision === "REJECTED") {
    const approved = decision === "APPROVED";

    await sendMail(
      registrationDecisionEmail(registration.user.email, {
        eventTitle: registration.event.title,
        roundName: registration.round?.name ?? null,
        approved,
      }),
    );

    // Worth an SMS: an approved entrant has to show up somewhere on a date, and
    // in Bangladesh a text reaches a student whose inbox they may not check.
    // Only sent to participants who opted in — see notify().
    await notify({
      userId: registration.user.id,
      type: approved ? "registration.approved" : "registration.rejected",
      title: approved
        ? `Registration approved: ${registration.event.title}`
        : `Registration not accepted: ${registration.event.title}`,
      body: registration.round?.name ?? undefined,
      href: "/dashboard/registrations",
      sms: approved
        ? `BdAIO: your registration for ${registration.event.title} is APPROVED. Details: ${appUrl("/dashboard/registrations")}`
        : undefined,
    });
  }

  revalidatePath("/admin/registrations");
  revalidatePath("/dashboard/registrations");
}
