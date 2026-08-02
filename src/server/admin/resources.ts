"use server";

import { revalidatePath } from "next/cache";
import * as z from "zod";
import { db } from "@/lib/db";
import { logActivity, requireRole } from "@/lib/auth/dal";
import { fieldErrors, slugSchema, type AdminFormState } from "@/lib/validation/admin";

/**
 * The resource library, made editable.
 *
 * Resources point at a URL — an internal page, or somewhere off-site. The
 * `Resource.filePath` column (a file under `UPLOAD_DIR`) is deliberately not
 * exposed here: serving arbitrary documents needs its own validated upload path
 * and an attachment-only route, which is the submissions machinery, not this
 * screen. Until that exists, uploading a PDF means putting it somewhere and
 * pasting the link — which is what the seeded rows already do.
 *
 * The public page is per-request (it filters `MEMBERS` rows by session), so it
 * needs no revalidation; only the admin list is cached.
 */

const KINDS = ["SYLLABUS", "GUIDELINE", "PAST_PROBLEM", "MATERIAL", "DOWNLOAD", "LINK"] as const;

const resourceSchema = z.object({
  title: z.string().trim().min(2, { error: "Title is required." }).max(200),
  titleBn: z
    .string()
    .trim()
    .max(200)
    .optional()
    .transform((v) => (v ? v : undefined)),
  description: z
    .string()
    .trim()
    .max(1000)
    .optional()
    .transform((v) => (v ? v : undefined)),
  kind: z.enum(KINDS),
  visibility: z.enum(["PUBLIC", "MEMBERS"]),
  // Either a site-relative path or a full external URL. Anything else — most
  // importantly a `javascript:` URL — is refused, because this becomes an href.
  url: z
    .string()
    .trim()
    .min(1, { error: "A link is required." })
    .max(500)
    .refine((v) => v.startsWith("/") || /^https?:\/\/\S+$/.test(v), {
      error: "Use a path starting with / or a full http(s) URL.",
    }),
  categoryId: z
    .string()
    .trim()
    .optional()
    .transform((v) => (v ? v : undefined)),
  published: z.coerce.boolean(),
});

export async function saveResource(
  _prev: AdminFormState,
  formData: FormData,
): Promise<AdminFormState> {
  const admin = await requireRole("ADMIN");
  const id = String(formData.get("id") ?? "") || null;

  const parsed = resourceSchema.safeParse({
    ...Object.fromEntries(formData.entries()),
    published: formData.get("published") === "on",
  });
  if (!parsed.success) return { errors: fieldErrors(parsed.error) };
  const data = parsed.data;

  if (data.categoryId) {
    const category = await db.resourceCategory.findUnique({
      where: { id: data.categoryId },
      select: { id: true },
    });
    if (!category) return { errors: { categoryId: ["That category no longer exists."] } };
  }

  const payload = {
    title: data.title,
    titleBn: data.titleBn ?? null,
    description: data.description ?? null,
    kind: data.kind,
    visibility: data.visibility,
    url: data.url,
    categoryId: data.categoryId ?? null,
    published: data.published,
  };

  const resource = id
    ? await db.resource.update({ where: { id }, data: payload })
    : await db.resource.create({ data: payload });

  await logActivity({
    userId: admin.id,
    action: id ? "admin.resource.updated" : "admin.resource.created",
    entityType: "Resource",
    entityId: resource.id,
    metadata: { title: resource.title, visibility: resource.visibility },
  });

  revalidatePath("/admin/resources");
  return { success: true, message: "Saved." };
}

export async function deleteResource(formData: FormData): Promise<void> {
  const admin = await requireRole("ADMIN");
  const id = String(formData.get("id") ?? "");

  const existing = await db.resource.findUnique({
    where: { id },
    select: { id: true, title: true },
  });
  if (!existing) return;

  await db.resource.delete({ where: { id } });
  await logActivity({
    userId: admin.id,
    action: "admin.resource.deleted",
    entityType: "Resource",
    entityId: id,
    metadata: { title: existing.title },
  });

  revalidatePath("/admin/resources");
}

// --- Categories ------------------------------------------------------------

const categorySchema = z.object({
  name: z.string().trim().min(2, { error: "Name is required." }).max(120),
  slug: slugSchema,
  order: z.coerce.number().int().min(0).max(999),
});

export async function saveCategory(
  _prev: AdminFormState,
  formData: FormData,
): Promise<AdminFormState> {
  const admin = await requireRole("ADMIN");
  const id = String(formData.get("id") ?? "") || null;

  const parsed = categorySchema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) return { errors: fieldErrors(parsed.error) };

  const clash = await db.resourceCategory.findFirst({
    where: { slug: parsed.data.slug, ...(id ? { id: { not: id } } : {}) },
    select: { id: true },
  });
  if (clash) return { errors: { slug: ["Another category already uses that slug."] } };

  const category = id
    ? await db.resourceCategory.update({ where: { id }, data: parsed.data })
    : await db.resourceCategory.create({ data: parsed.data });

  await logActivity({
    userId: admin.id,
    action: id ? "admin.resource_category.updated" : "admin.resource_category.created",
    entityType: "ResourceCategory",
    entityId: category.id,
  });

  revalidatePath("/admin/resources");
  return { success: true, message: "Saved." };
}

/**
 * Deletes a category. Its resources are kept — the relation is `SetNull`, so
 * they fall back to the "General" group on the public page rather than
 * disappearing with the heading they happened to sit under.
 */
export async function deleteCategory(formData: FormData): Promise<void> {
  const admin = await requireRole("ADMIN");
  const id = String(formData.get("id") ?? "");

  const existing = await db.resourceCategory.findUnique({
    where: { id },
    select: { id: true, name: true },
  });
  if (!existing) return;

  await db.resourceCategory.delete({ where: { id } });
  await logActivity({
    userId: admin.id,
    action: "admin.resource_category.deleted",
    entityType: "ResourceCategory",
    entityId: id,
    metadata: { name: existing.name },
  });

  revalidatePath("/admin/resources");
}
