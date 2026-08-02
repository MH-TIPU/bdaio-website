import type { Metadata } from "next";
import { SettingsForm } from "@/components/admin/SettingsForm";
import { SETTINGS, getSettings, type SettingKey } from "@/lib/settings";

export const metadata: Metadata = { title: "Site settings · Admin" };

export default async function AdminSettingsPage() {
  const settings = await getSettings();

  // The form edits strings — a checkbox needs "true"/"false", not a boolean —
  // so the typed values are flattened back to the shape they are stored in.
  const values = Object.fromEntries(
    SETTINGS.map((setting) => [setting.key, String(settings[setting.key as keyof typeof settings])]),
  ) as Record<SettingKey, string>;

  return (
    <>
      <h1 className="text-2xl font-bold text-slate-900">Site settings</h1>
      <p className="mt-1 text-sm text-slate-600">
        Details the public site reads at render time. Saving refreshes every cached page, so a
        change is live within a few seconds — no deploy.
      </p>

      <SettingsForm values={values} />
    </>
  );
}
