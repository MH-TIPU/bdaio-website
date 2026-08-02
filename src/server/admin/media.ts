"use server";

import { revalidatePath } from "next/cache";
import * as z from "zod";
import { db } from "@/lib/db";
import { logActivity, requireRole } from "@/lib/auth/dal";
import { fieldErrors, type AdminFormState } from "@/lib/validation/admin";
import { deleteImage, saveImage } from "@/lib/storage/uploads";

/**
 * The image library.
 *
 * Uploading is separate from using: an asset is stored once here and then picked
 * by a sponsor, so replacing a logo is one upload rather than a hunt through
 * every screen that shows it.
 */

const detailsSchema = z.object({
  title: z.string().trim().min(2, { error: "Give the image a name." }).max(160),
  alt: z
    .string()
    .trim()
    .max(300)
    .optional()
    .transform((v) => (v ? v : undefined)),
});

export async function uploadMedia(
  _prev: AdminFormState,
  formData: FormData,
): Promise<AdminFormState> {
  const admin = await requireRole("ADMIN");

  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return { errors: { file: ["Choose an image to upload."] } };
  }

  const parsed = detailsSchema.safeParse({
    title: formData.get("title") || file.name.replace(/\.[^.]+$/, ""),
    alt: formData.get("alt"),
  });
  if (!parsed.success) return { errors: fieldErrors(parsed.error) };

  const stored = await saveImage(file);
  if (!stored.ok) return { errors: { file: [stored.error] } };

  const asset = await db.mediaAsset.create({
    data: {
      filename: stored.filename,
      title: parsed.data.title,
      alt: parsed.data.alt ?? null,
      width: stored.width,
      height: stored.height,
      sizeBytes: stored.sizeBytes,
      uploadedById: admin.id,
    },
  });

  await logActivity({
    userId: admin.id,
    action: "admin.media.uploaded",
    entityType: "MediaAsset",
    entityId: asset.id,
    metadata: { title: asset.title },
  });

  revalidatePath("/admin/media");
  return { success: true, message: "Uploaded." };
}

export async function updateMedia(
  _prev: AdminFormState,
  formData: FormData,
): Promise<AdminFormState> {
  const admin = await requireRole("ADMIN");
  const id = String(formData.get("id") ?? "");

  const parsed = detailsSchema.safeParse({
    title: formData.get("title"),
    alt: formData.get("alt"),
  });
  if (!parsed.success) return { errors: fieldErrors(parsed.error) };

  const existing = await db.mediaAsset.findUnique({ where: { id }, select: { id: true } });
  if (!existing) return { errors: { form: ["That image no longer exists."] } };

  await db.mediaAsset.update({
    where: { id },
    data: { title: parsed.data.title, alt: parsed.data.alt ?? null },
  });

  await logActivity({
    userId: admin.id,
    action: "admin.media.updated",
    entityType: "MediaAsset",
    entityId: id,
  });

  // Alt text is rendered on the public page, so the sponsor sections must drop.
  revalidatePath("/admin/media");
  revalidatePath("/[locale]", "page");
  return { success: true, message: "Saved." };
}

/**
 * Deletes an image, and the file behind it.
 *
 * An asset still referenced by a sponsor is refused rather than deleted: the
 * relation is `SetNull`, so the database would happily accept it and leave a
 * sponsor with no logo on the live home page. Making the admin unpick it first
 * is the difference between a decision and an accident.
 */
export async function deleteMedia(
  _prev: AdminFormState,
  formData: FormData,
): Promise<AdminFormState> {
  const admin = await requireRole("ADMIN");
  const id = String(formData.get("id") ?? "");

  const asset = await db.mediaAsset.findUnique({
    where: { id },
    select: { id: true, filename: true, title: true, _count: { select: { sponsors: true } } },
  });
  if (!asset) return { success: true, message: "Already deleted." };

  if (asset._count.sponsors > 0) {
    return {
      errors: {
        form: [
          `Still used by ${asset._count.sponsors} sponsor${
            asset._count.sponsors === 1 ? "" : "s"
          }. Remove it there first.`,
        ],
      },
    };
  }

  await db.mediaAsset.delete({ where: { id } });
  await deleteImage(asset.filename);

  await logActivity({
    userId: admin.id,
    action: "admin.media.deleted",
    entityType: "MediaAsset",
    entityId: id,
    metadata: { title: asset.title },
  });

  revalidatePath("/admin/media");
  return { success: true, message: "Deleted." };
}
