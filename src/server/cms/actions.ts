"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import * as z from "zod";
import { db } from "@/lib/db";
import { logActivity, requireRole } from "@/lib/auth/dal";
import { revokeAllSessions } from "@/lib/auth/session";
import { fieldErrors } from "@/lib/validation/admin";
import { notify } from "@/lib/notifications/notify";

export type CmsState =
  | { errors?: Record<string, string[] | undefined>; message?: string; success?: boolean }
  | undefined;

const optional = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .optional()
    .transform((v) => (v ? v : undefined));

const optionalDate = z
  .string()
  .trim()
  .optional()
  .transform((v) => (v ? v : undefined))
  .refine((v) => !v || !Number.isNaN(Date.parse(v)), { error: "Enter a valid date." })
  .transform((v) => (v ? new Date(v) : undefined));

// --- Editable pages --------------------------------------------------------

const pageSchema = z.object({
  slug: z
    .string()
    .trim()
    .toLowerCase()
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, { error: "Use lowercase letters, numbers, hyphens." }),
  title: z.string().trim().min(2, { error: "Title is required." }).max(160),
  titleBn: optional(160),
  body: z.string().trim().min(1, { error: "Content is required." }).max(20000),
  bodyBn: optional(20000),
  published: z.coerce.boolean(),
});

export async function savePage(_prev: CmsState, formData: FormData): Promise<CmsState> {
  const admin = await requireRole("ADMIN");
  const id = String(formData.get("id") ?? "") || null;

  const parsed = pageSchema.safeParse({
    ...Object.fromEntries(formData.entries()),
    published: formData.get("published") === "on",
  });
  if (!parsed.success) return { errors: fieldErrors(parsed.error) };
  const data = parsed.data;

  const clash = await db.page.findFirst({
    where: { slug: data.slug, ...(id ? { id: { not: id } } : {}) },
    select: { id: true },
  });
  if (clash) return { errors: { slug: ["That slug is already used by another page."] } };

  const payload = {
    ...data,
    titleBn: data.titleBn ?? null,
    bodyBn: data.bodyBn ?? null,
    updatedById: admin.id,
  };

  const page = id
    ? await db.page.update({ where: { id }, data: payload })
    : await db.page.create({ data: payload });

  await logActivity({
    userId: admin.id,
    action: id ? "admin.page.updated" : "admin.page.created",
    entityType: "Page",
    entityId: page.id,
  });

  // The public page reads this content, so its cache must drop.
  revalidatePath(`/p/${page.slug}`);
  revalidatePath("/admin/content");
  redirect("/admin/content");
}

export async function deletePage(formData: FormData): Promise<void> {
  const admin = await requireRole("ADMIN");
  const id = String(formData.get("id") ?? "");
  if (!id) return;

  await db.page.delete({ where: { id } });

  await logActivity({
    userId: admin.id,
    action: "admin.page.deleted",
    entityType: "Page",
    entityId: id,
  });

  revalidatePath("/admin/content");
}

// --- Announcements ---------------------------------------------------------

const announcementSchema = z.object({
  title: z.string().trim().min(3, { error: "Title is required." }).max(200),
  titleBn: optional(200),
  body: z.string().trim().min(3, { error: "Message is required." }).max(5000),
  bodyBn: optional(5000),
  audience: z.enum(["EVERYONE", "MEMBERS", "MODERATORS"]),
  pinned: z.coerce.boolean(),
  published: z.coerce.boolean(),
  publishAt: optionalDate,
  expiresAt: optionalDate,
});

export async function saveAnnouncement(
  _prev: CmsState,
  formData: FormData,
): Promise<CmsState> {
  const admin = await requireRole("ADMIN");
  const id = String(formData.get("id") ?? "") || null;

  const parsed = announcementSchema.safeParse({
    ...Object.fromEntries(formData.entries()),
    pinned: formData.get("pinned") === "on",
    published: formData.get("published") === "on",
  });
  if (!parsed.success) return { errors: fieldErrors(parsed.error) };
  const data = parsed.data;

  if (data.expiresAt && data.publishAt && data.expiresAt < data.publishAt) {
    return { errors: { expiresAt: ["Expiry cannot be before the publish date."] } };
  }

  const payload = {
    ...data,
    titleBn: data.titleBn ?? null,
    bodyBn: data.bodyBn ?? null,
    publishAt: data.publishAt ?? null,
    expiresAt: data.expiresAt ?? null,
    createdById: admin.id,
  };

  const announcement = id
    ? await db.announcement.update({ where: { id }, data: payload })
    : await db.announcement.create({ data: payload });

  await logActivity({
    userId: admin.id,
    action: id ? "admin.announcement.updated" : "admin.announcement.created",
    entityType: "Announcement",
    entityId: announcement.id,
  });

  revalidatePath("/announcements");
  revalidatePath("/admin/announcements");
  redirect("/admin/announcements");
}

export async function deleteAnnouncement(formData: FormData): Promise<void> {
  const admin = await requireRole("ADMIN");
  const id = String(formData.get("id") ?? "");
  const existing = await db.announcement.findUnique({ where: { id }, select: { id: true } });
  if (!existing) return;

  await db.announcement.delete({ where: { id } });
  await logActivity({
    userId: admin.id,
    action: "admin.announcement.deleted",
    entityType: "Announcement",
    entityId: id,
  });
  revalidatePath("/announcements");
  revalidatePath("/admin/announcements");
}

// --- FAQ -------------------------------------------------------------------

const faqSchema = z.object({
  section: z.string().trim().min(1, { error: "Section is required." }).max(120),
  question: z.string().trim().min(5, { error: "Question is required." }).max(400),
  answer: z.string().trim().min(5, { error: "Answer is required." }).max(4000),
  order: z.coerce.number().int().min(0).max(999),
  published: z.coerce.boolean(),
});

export async function saveFaq(_prev: CmsState, formData: FormData): Promise<CmsState> {
  const admin = await requireRole("ADMIN");
  const id = String(formData.get("id") ?? "") || null;

  const parsed = faqSchema.safeParse({
    ...Object.fromEntries(formData.entries()),
    published: formData.get("published") === "on",
  });
  if (!parsed.success) return { errors: fieldErrors(parsed.error) };

  const item = id
    ? await db.faqItem.update({ where: { id }, data: parsed.data })
    : await db.faqItem.create({ data: parsed.data });

  await logActivity({
    userId: admin.id,
    action: id ? "admin.faq.updated" : "admin.faq.created",
    entityType: "FaqItem",
    entityId: item.id,
  });

  revalidatePath("/faq");
  revalidatePath("/admin/faq");
  return { success: true, message: "Saved." };
}

export async function deleteFaq(formData: FormData): Promise<void> {
  const admin = await requireRole("ADMIN");
  const id = String(formData.get("id") ?? "");
  const existing = await db.faqItem.findUnique({ where: { id }, select: { id: true } });
  if (!existing) return;

  await db.faqItem.delete({ where: { id } });
  await logActivity({
    userId: admin.id,
    action: "admin.faq.deleted",
    entityType: "FaqItem",
    entityId: id,
  });
  revalidatePath("/faq");
  revalidatePath("/admin/faq");
}

// --- User administration ---------------------------------------------------

const ROLES = ["PARTICIPANT", "INSTITUTION_MODERATOR", "ADMIN", "SUPER_ADMIN"] as const;

/**
 * Changes a user's account role.
 *
 * Only a SUPER_ADMIN may create or remove admins — otherwise an admin could
 * promote themselves or demote the person who appointed them. An admin may
 * still manage participants and moderators.
 */
export async function setUserRole(formData: FormData): Promise<void> {
  const actor = await requireRole("ADMIN");
  const userId = String(formData.get("userId") ?? "");
  const role = String(formData.get("role") ?? "");
  if (!ROLES.includes(role as (typeof ROLES)[number])) return;

  const target = await db.user.findUnique({
    where: { id: userId },
    select: { id: true, role: true, email: true },
  });
  if (!target) return;

  // Nobody edits their own role — that is how privilege escalation starts.
  if (target.id === actor.id) return;

  const touchesAdmin =
    role === "ADMIN" ||
    role === "SUPER_ADMIN" ||
    target.role === "ADMIN" ||
    target.role === "SUPER_ADMIN";
  if (touchesAdmin && actor.role !== "SUPER_ADMIN") return;

  await db.user.update({ where: { id: userId }, data: { role: role as (typeof ROLES)[number] } });

  await logActivity({
    userId: actor.id,
    action: "admin.user.role_changed",
    entityType: "User",
    entityId: userId,
    metadata: { from: target.role, to: role, email: target.email },
  });

  revalidatePath("/admin/users");
}

export async function setUserStatus(formData: FormData): Promise<void> {
  const actor = await requireRole("ADMIN");
  const userId = String(formData.get("userId") ?? "");
  const status = String(formData.get("status") ?? "");
  if (!["ACTIVE", "SUSPENDED"].includes(status)) return;

  const target = await db.user.findUnique({
    where: { id: userId },
    select: { id: true, role: true, email: true },
  });
  if (!target || target.id === actor.id) return;

  // Suspending an admin requires super-admin authority.
  if (
    (target.role === "ADMIN" || target.role === "SUPER_ADMIN") &&
    actor.role !== "SUPER_ADMIN"
  ) {
    return;
  }

  await db.user.update({
    where: { id: userId },
    data: { status: status as "ACTIVE" | "SUSPENDED" },
  });

  // Suspension must take effect immediately, not at session expiry.
  if (status === "SUSPENDED") {
    await revokeAllSessions(userId);
  } else {
    await notify({
      userId,
      type: "account.reinstated",
      title: "Your account has been reinstated",
      href: "/dashboard",
    });
  }

  await logActivity({
    userId: actor.id,
    action: status === "SUSPENDED" ? "admin.user.suspended" : "admin.user.reinstated",
    entityType: "User",
    entityId: userId,
    metadata: { email: target.email },
  });

  revalidatePath("/admin/users");
}
