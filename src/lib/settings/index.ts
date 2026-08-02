import "server-only";
import { cache } from "react";
import { db } from "@/lib/db";
import {
  SETTINGS,
  decodeSetting,
  type SettingKey,
  type SiteSettings,
} from "@/lib/settings/registry";

export * from "@/lib/settings/registry";

/**
 * Reads the editable site settings.
 *
 * `cache()` memoizes per render pass, so a layout, a page, and a JSON-LD helper
 * asking for settings in the same request cost one query between them — the same
 * arrangement the DAL uses for the session.
 *
 * **Failure is soft on purpose.** These values decorate the site: a footer link,
 * an address, a notice bar. If the database is unreachable, serving the shipped
 * defaults is right, and taking down every public page because a phone number
 * could not be read is not. Real failures still surface — the pages that depend
 * on the database for their actual content fail on their own queries.
 *
 * Cached page output does not expire on its own. `saveSettings` revalidates the
 * whole public tree, which is what makes a change visible without a deploy.
 */
export const getSettings = cache(async (): Promise<SiteSettings> => {
  let stored = new Map<string, string>();

  try {
    const rows = await db.siteSetting.findMany({ select: { key: true, value: true } });
    stored = new Map(rows.map((row) => [row.key, row.value]));
  } catch (error) {
    console.error("Failed to read site settings; falling back to defaults", error);
  }

  const resolved = {} as Record<SettingKey, string | boolean>;
  for (const setting of SETTINGS) {
    resolved[setting.key] = decodeSetting(setting, stored.get(setting.key));
  }
  return resolved as SiteSettings;
});

/**
 * The social profiles that have a URL, in the order they are declared.
 *
 * Shared by the footer and the organisation's structured data so the two cannot
 * disagree about where we are — `sameAs` claiming a LinkedIn page the site does
 * not link to is the kind of drift that only shows up in Search Console.
 */
export function socialLinks(settings: SiteSettings): { key: SettingKey; label: string; url: string }[] {
  return SETTINGS.filter((setting) => setting.group === "Social links")
    .map((setting) => ({
      key: setting.key,
      label: setting.label,
      url: String(settings[setting.key as keyof SiteSettings] ?? ""),
    }))
    .filter((link) => link.url !== "");
}
