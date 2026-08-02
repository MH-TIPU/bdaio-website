"use server";

import { revalidatePath } from "next/cache";
import * as z from "zod";
import { db } from "@/lib/db";
import { logActivity, requireRole } from "@/lib/auth/dal";
import { fieldErrors, type AdminFormState } from "@/lib/validation/admin";
import { SPONSOR_TIERS } from "@/lib/sponsors";

const sponsorSchema = z.object({
  name: z.string().trim().min(2, { error: "Name is required." }).max(160),
  nameBn: z
    .string()
    .trim()
    .max(160)
    .optional()
    .transform((v) => (v ? v : undefined)),
  tier: z.enum(SPONSOR_TIERS),
  url: z
    .string()
    .trim()
    .max(300)
    .optional()
    .transform((v) => (v ? v : undefined))
    // Same rule as the social links in site settings: a logo that links to a
    // `javascript:` URL is a stored XSS with a picture on it.
    .refine((v) => !v || /^https?:\/\/\S+$/.test(v), {
      error: "Enter a full URL starting with http:// or https://",
    }),
  assetId: z
    .string()
    .trim()
    .optional()
    .transform((v) => (v ? v : undefined)),
  order: z.coerce.number().int().min(0).max(999),
  published: z.coerce.boolean(),
});

/** Both the home page and the admin list have to drop when a sponsor changes. */
function revalidateSponsors() {
  revalidatePath("/admin/sponsors");
  revalidatePath("/[locale]", "page");
}

export async function saveSponsor(
  _prev: AdminFormState,
  formData: FormData,
): Promise<AdminFormState> {
  const admin = await requireRole("ADMIN");
  const id = String(formData.get("id") ?? "") || null;

  const parsed = sponsorSchema.safeParse({
    ...Object.fromEntries(formData.entries()),
    published: formData.get("published") === "on",
  });
  if (!parsed.success) return { errors: fieldErrors(parsed.error) };
  const data = parsed.data;

  // A picked asset that has since been deleted would otherwise fail as a foreign
  // key error, which is a 500 rather than something an admin can act on.
  if (data.assetId) {
    const asset = await db.mediaAsset.findUnique({
      where: { id: data.assetId },
      select: { id: true },
    });
    if (!asset) return { errors: { assetId: ["That image no longer exists."] } };
  }

  const payload = {
    name: data.name,
    nameBn: data.nameBn ?? null,
    tier: data.tier,
    url: data.url ?? null,
    assetId: data.assetId ?? null,
    order: data.order,
    published: data.published,
  };

  const sponsor = id
    ? await db.sponsor.update({ where: { id }, data: payload })
    : await db.sponsor.create({ data: payload });

  await logActivity({
    userId: admin.id,
    action: id ? "admin.sponsor.updated" : "admin.sponsor.created",
    entityType: "Sponsor",
    entityId: sponsor.id,
    metadata: { name: sponsor.name, tier: sponsor.tier },
  });

  revalidateSponsors();
  return { success: true, message: "Saved." };
}

export async function deleteSponsor(formData: FormData): Promise<void> {
  const admin = await requireRole("ADMIN");
  const id = String(formData.get("id") ?? "");

  const existing = await db.sponsor.findUnique({
    where: { id },
    select: { id: true, name: true },
  });
  if (!existing) return;

  // Only the placement goes; the logo stays in the library for the next edition.
  await db.sponsor.delete({ where: { id } });

  await logActivity({
    userId: admin.id,
    action: "admin.sponsor.deleted",
    entityType: "Sponsor",
    entityId: id,
    metadata: { name: existing.name },
  });

  revalidateSponsors();
}
