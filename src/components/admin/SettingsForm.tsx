"use client";

import { useActionState, useState } from "react";
import { Field } from "@/components/ui/Field";
import { TextArea } from "@/components/ui/TextArea";
import { Button } from "@/components/ui/Button";
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

const GROUP_ICONS: Record<string, string> = {
  Contact: "📞",
  "Social links": "🌐",
  "Public site": "📣",
};

const GROUP_DESCRIPTIONS: Record<string, string> = {
  Contact: "Official contact details displayed across the website and metadata.",
  "Social links": "Official social profile URLs linked in the footer and SEO schemas.",
  "Public site": "Site-wide announcement notice controls and account registration toggles.",
};

const SOCIAL_ICONS: Record<string, string> = {
  "social.facebook": "🔵",
  "social.youtube": "🔴",
  "social.linkedin": "💼",
  "social.x": "𝕏",
  "social.github": "🐙",
};

export function SettingsForm({ values }: { values: Record<SettingKey, string> }) {
  const [state, action, pending] = useActionState(saveSettings, undefined);
  const [activeTab, setActiveTab] = useState<string>("all");
  const errors = state?.errors;

  const activeGroups =
    activeTab === "all" ? SETTING_GROUPS : SETTING_GROUPS.filter((g) => g === activeTab);

  return (
    <form action={action} className="mt-6 space-y-8" noValidate>
      {/* Category Tabs Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-4">
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setActiveTab("all")}
            className={`rounded-xl px-4 py-2 text-xs font-bold transition-all ${
              activeTab === "all"
                ? "bg-bdaio-blue text-white shadow-xs"
                : "bg-white text-slate-600 hover:bg-slate-100 ring-1 ring-slate-200"
            }`}
          >
            All Settings
          </button>
          {SETTING_GROUPS.map((group) => (
            <button
              key={group}
              type="button"
              onClick={() => setActiveTab(group)}
              className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition-all ${
                activeTab === group
                  ? "bg-bdaio-blue text-white shadow-xs"
                  : "bg-white text-slate-600 hover:bg-slate-100 ring-1 ring-slate-200"
              }`}
            >
              <span>{GROUP_ICONS[group]}</span>
              <span>{group}</span>
            </button>
          ))}
        </div>

        <span className="text-xs text-slate-500">
          {SETTINGS.length} total configurable parameters
        </span>
      </div>

      {/* Settings Sections */}
      <div className="space-y-8">
        {activeGroups.map((group) => (
          <section
            key={group}
            className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-200/80 transition-all"
          >
            <div className="border-b border-slate-100 bg-slate-50/60 px-6 py-4.5 sm:px-8">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-lg shadow-xs ring-1 ring-slate-200/60">
                  {GROUP_ICONS[group]}
                </span>
                <div>
                  <h2 className="text-base font-bold text-slate-900">{group}</h2>
                  <p className="text-xs text-slate-500">{GROUP_DESCRIPTIONS[group]}</p>
                </div>
              </div>
            </div>

            <div className="p-6 sm:p-8">
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                {SETTINGS.filter((setting) => setting.group === group).map((setting) => {
                  const keyStr = String(setting.key);
                  const isFullWidth =
                    setting.type === "textarea" ||
                    keyStr === "contact.address" ||
                    keyStr === "site.notice" ||
                    keyStr === "site.noticeTitle" ||
                    keyStr === "site.noticeUrl";

                  return (
                    <div
                      key={setting.key}
                      className={isFullWidth ? "sm:col-span-2" : "sm:col-span-1"}
                    >
                      <SettingField
                        setting={setting}
                        value={values[setting.key]}
                        errors={errors?.[setting.key]}
                      />
                    </div>
                  );
                })}
              </div>
            </div>
          </section>
        ))}
      </div>

      {/* Standard Page Action Bar */}
      <div className="flex flex-wrap items-center gap-3 pt-2">
        <Button
          type="submit"
          disabled={pending}
          className="w-auto px-6"
        >
          {pending ? "Saving…" : "Save settings"}
        </Button>
        {state?.message && (
          <p
            role={state.success ? "status" : "alert"}
            className={`text-sm font-medium ${
              state.success ? "text-emerald-700" : "text-red-600"
            }`}
          >
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
  const [enabled, setEnabled] = useState(value === "true");

  if (setting.type === "boolean") {
    return (
      <div className="flex items-start justify-between gap-4 rounded-xl border border-slate-100 bg-slate-50/50 p-4 transition hover:bg-slate-50">
        <div className="space-y-1">
          <label htmlFor={setting.key} className="text-sm font-bold text-slate-900 cursor-pointer">
            {setting.label}
          </label>
          {setting.hint && <p className="text-xs leading-relaxed text-slate-500">{setting.hint}</p>}
        </div>

        <input type="hidden" name={setting.key} value={enabled ? "on" : ""} />
        <button
          id={setting.key}
          type="button"
          role="switch"
          aria-checked={enabled}
          onClick={() => setEnabled(!enabled)}
          className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
            enabled ? "bg-emerald-600" : "bg-slate-300"
          }`}
        >
          <span
            className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
              enabled ? "translate-x-5" : "translate-x-0"
            }`}
          />
        </button>
      </div>
    );
  }

  if (setting.type === "textarea") {
    return (
      <TextArea
        label={setting.label}
        name={setting.key}
        rows={3}
        defaultValue={value}
        hint={setting.hint}
        errors={errors}
      />
    );
  }

  if (setting.key === "site.noticeType") {
    return (
      <div>
        <label htmlFor={setting.key} className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
          {setting.label}
        </label>
        <select
          id={setting.key}
          name={setting.key}
          defaultValue={value || "topbar"}
          className="block w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm font-medium text-slate-900 focus:border-bdaio-blue focus:outline-none focus:ring-2 focus:ring-bdaio-blue/30"
        >
          <option value="topbar">📢 Topbar Banner (Header Strip)</option>
          <option value="modal">💬 Popup Modal (Center Dialog)</option>
        </select>
        {setting.hint && <p className="mt-1.5 text-xs text-slate-500">{setting.hint}</p>}
      </div>
    );
  }

  const socialIcon = SOCIAL_ICONS[setting.key];

  return (
    <div>
      {socialIcon && (
        <div className="flex items-center gap-1.5 mb-1 text-xs font-semibold text-slate-500">
          <span>{socialIcon}</span>
          <span>{setting.label}</span>
        </div>
      )}
      <Field
        label={socialIcon ? "" : setting.label}
        name={setting.key}
        type={INPUT_TYPE[setting.type]}
        defaultValue={value}
        hint={setting.hint}
        errors={errors}
      />
    </div>
  );
}
