"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { logActivity, requireRole } from "@/lib/auth/dal";
import { fieldErrors } from "@/lib/validation/admin";
import { SETTINGS, settingsFormSchema } from "@/lib/settings/registry";
import type { AdminFormState } from "@/lib/validation/admin";

/**
 * Saves the site settings.
 *
 * The form posts every setting on every save, so the incoming payload is the
 * complete desired state — which makes "what changed" a diff against the stored
 * rows rather than something the form has to track. Only changed keys are
 * written, so an unrelated `updatedAt` does not move and the audit entry says
 * what an organiser actually touched.
 */
export async function saveSettings(
  _prev: AdminFormState,
  formData: FormData,
): Promise<AdminFormState> {
  const admin = await requireRole("ADMIN");

  // Read by key rather than from the raw entries: a checkbox that is off submits
  // nothing, and the schema needs the absent field present as an empty string.
  const raw = Object.fromEntries(
    SETTINGS.map((setting) => [setting.key, String(formData.get(setting.key) ?? "")]),
  );

  const parsed = settingsFormSchema.safeParse(raw);
  if (!parsed.success) return { errors: fieldErrors(parsed.error) };
  const values: Record<string, string> = parsed.data;

  const existing = new Map(
    (await db.siteSetting.findMany({ select: { key: true, value: true } })).map((row) => [
      row.key,
      row.value,
    ]),
  );

  const changed = SETTINGS.filter((setting) => {
    const next = values[setting.key];
    // A key with no row yet counts as changed only if it differs from what the
    // site already renders, so saving an untouched form writes nothing.
    return next !== (existing.get(setting.key) ?? setting.default);
  });

  if (changed.length === 0) return { success: true, message: "No changes to save." };

  await db.$transaction(
    changed.map((setting) =>
      db.siteSetting.upsert({
        where: { key: setting.key },
        create: { key: setting.key, value: values[setting.key] },
        update: { value: values[setting.key] },
      }),
    ),
  );

  await logActivity({
    userId: admin.id,
    action: "admin.settings.updated",
    entityType: "SiteSetting",
    metadata: { keys: changed.map((setting) => setting.key) },
  });

  // Settings reach the footer and the notice bar, which are in the public root
  // layout — every cached public page holds a copy of them.
  revalidatePath("/", "layout");

  return { success: true, message: `Saved ${changed.length} change${changed.length === 1 ? "" : "s"}.` };
}
