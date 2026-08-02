"use client";

import { useActionState } from "react";
import { Field } from "@/components/ui/Field";
import { TextArea } from "@/components/ui/TextArea";
import { saveSettings } from "@/server/admin/settings";
import {
  SETTINGS,
  SETTING_GROUPS,
  type SettingDefinition,
  type SettingKey,
} from "@/lib/settings/registry";

const INPUT_TYPE = {
  text: "text",
  email: "email",
  url: "url",
  tel: "tel",
} as const;

/**
 * The whole settings form, rendered from the registry rather than written out
 * by hand — adding a setting to `SETTINGS` gives it a field here, which is what
 * stops the form and the values the site reads from drifting apart.
 *
 * Every setting posts on every save (see `saveSettings`), so this is one form,
 * not one per group.
 */
export function SettingsForm({ values }: { values: Record<SettingKey, string> }) {
  const [state, action, pending] = useActionState(saveSettings, undefined);
  const errors = state?.errors;

  return (
    <form action={action} className="mt-6 space-y-6" noValidate>
      {SETTING_GROUPS.map((group) => (
        <section key={group} className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-slate-100">
          <h2 className="text-sm font-semibold text-slate-900">{group}</h2>
          <div className="mt-4 space-y-4">
            {SETTINGS.filter((setting) => setting.group === group).map((setting) => (
              <SettingField
                key={setting.key}
                setting={setting}
                value={values[setting.key]}
                errors={errors?.[setting.key]}
              />
            ))}
          </div>
        </section>
      ))}

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={pending}
          className="rounded-lg bg-bdaio-blue px-4 py-2.5 text-sm font-semibold text-white hover:bg-bdaio-blue-dark disabled:opacity-60"
        >
          {pending ? "Saving…" : "Save settings"}
        </button>
        {state?.success && (
          <p role="status" className="text-sm font-medium text-emerald-700">
            {state.message}
          </p>
        )}
      </div>
    </form>
  );
}

function SettingField({
  setting,
  value,
  errors,
}: {
  setting: SettingDefinition;
  value: string;
  errors?: string[];
}) {
  const bengali = setting.bengali ? "font-bengali" : "";

  if (setting.type === "boolean") {
    return (
      <div>
        <label className="flex items-start gap-2.5 text-sm font-medium text-slate-700">
          <input
            type="checkbox"
            name={setting.key}
            defaultChecked={value === "true"}
            className="mt-0.5 h-4 w-4 rounded border-slate-300"
          />
          {setting.label}
        </label>
        {setting.hint && <p className="mt-1.5 pl-6 text-xs text-slate-500">{setting.hint}</p>}
      </div>
    );
  }

  if (setting.type === "textarea") {
    return (
      <TextArea
        label={setting.label}
        name={setting.key}
        rows={2}
        defaultValue={value}
        hint={setting.hint}
        errors={errors}
        className={bengali}
      />
    );
  }

  return (
    <Field
      label={setting.label}
      name={setting.key}
      type={INPUT_TYPE[setting.type]}
      defaultValue={value}
      hint={setting.hint}
      errors={errors}
      className={bengali}
    />
  );
}
