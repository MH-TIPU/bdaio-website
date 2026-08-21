"use client";

import { useActionState, useState } from "react";
import { saveSettings } from "@/server/admin/settings";
import { Button } from "@/components/ui/Button";

export type NoticeManagerProps = {
  enabled: boolean;
  type: string;
  title: string;
  text: string;
  url: string;
  /** Complete current settings dictionary required by saveSettings form validation */
  allSettings: Record<string, string>;
};

export function SiteNoticeManager({
  enabled: initialEnabled,
  type: initialType,
  title: initialTitle,
  text: initialText,
  url: initialUrl,
  allSettings,
}: NoticeManagerProps) {
  const [state, action, pending] = useActionState(saveSettings, undefined);

  const [enabled, setEnabled] = useState(initialEnabled);
  const [type, setType] = useState(initialType || "topbar");
  const [title, setTitle] = useState(initialTitle || "Important Announcement");
  const [text, setText] = useState(initialText || "");
  const [url, setUrl] = useState(initialUrl || "");

  return (
    <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-100 sm:p-8">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-5">
        <div>
          <h2 className="text-lg font-bold text-slate-900">Site Broadcast & Notice Manager</h2>
          <p className="mt-0.5 text-xs text-slate-500">
            Publish a site-wide announcement banner or interactive popup modal.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-slate-600">
            {enabled ? "Live Broadcasting" : "Disabled"}
          </span>
          <button
            type="button"
            onClick={() => setEnabled(!enabled)}
            className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
              enabled ? "bg-emerald-600" : "bg-slate-200"
            }`}
          >
            <span
              className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                enabled ? "translate-x-5" : "translate-x-0"
              }`}
            />
          </button>
        </div>
      </div>

      <form action={action} className="mt-6 space-y-5">
        {/* Pass all existing setting values so form submit preserves unrelated settings */}
        {Object.entries(allSettings).map(([key, val]) => {
          if (
            key === "site.noticeEnabled" ||
            key === "site.noticeType" ||
            key === "site.noticeTitle" ||
            key === "site.notice" ||
            key === "site.noticeUrl"
          ) {
            return null; // Rendered explicitly below
          }
          return <input key={key} type="hidden" name={key} value={val} />;
        })}

        <input type="hidden" name="site.noticeEnabled" value={enabled ? "on" : ""} />

        {/* Display Format Choice */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500">
            Display Format
          </label>
          <input type="hidden" name="site.noticeType" value={type} />
          <div className="mt-2 grid grid-cols-2 gap-3 max-w-md">
            <button
              type="button"
              onClick={() => setType("topbar")}
              className={`flex flex-col items-center gap-2 rounded-xl p-3.5 text-center text-xs font-semibold ring-1 transition ${
                type === "topbar"
                  ? "bg-bdaio-blue/10 text-bdaio-blue ring-bdaio-blue"
                  : "bg-slate-50 text-slate-600 ring-slate-200 hover:bg-slate-100"
              }`}
            >
              <span className="text-lg">📢</span>
              <span>Topbar Banner</span>
              <span className="text-[10px] font-normal text-slate-500">
                Single bar above header
              </span>
            </button>

            <button
              type="button"
              onClick={() => setType("modal")}
              className={`flex flex-col items-center gap-2 rounded-xl p-3.5 text-center text-xs font-semibold ring-1 transition ${
                type === "modal"
                  ? "bg-bdaio-blue/10 text-bdaio-blue ring-bdaio-blue"
                  : "bg-slate-50 text-slate-600 ring-slate-200 hover:bg-slate-100"
              }`}
            >
              <span className="text-lg">💬</span>
              <span>Popup Modal</span>
              <span className="text-[10px] font-normal text-slate-500">
                Center screen overlay dialog
              </span>
            </button>
          </div>
        </div>

        {/* Notice Title (Modal Mode) */}
        {type === "modal" && (
          <div>
            <label htmlFor="site.noticeTitle" className="block text-xs font-semibold text-slate-700">
              Modal Heading Title
            </label>
            <input
              id="site.noticeTitle"
              name="site.noticeTitle"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. National Round Registration Open!"
              className="mt-1.5 w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm focus:border-bdaio-blue focus:outline-none focus:ring-2 focus:ring-bdaio-blue/30"
            />
          </div>
        )}

        {/* Notice Content */}
        <div>
          <label htmlFor="site.notice" className="block text-xs font-semibold text-slate-700">
            Announcement Message / Text
          </label>
          <textarea
            id="site.notice"
            name="site.notice"
            rows={3}
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Write your announcement or notice text here..."
            className="mt-1.5 w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm focus:border-bdaio-blue focus:outline-none focus:ring-2 focus:ring-bdaio-blue/30"
          />
        </div>

        {/* Optional Action URL */}
        <div>
          <label htmlFor="site.noticeUrl" className="block text-xs font-semibold text-slate-700">
            Action Button Link URL <span className="font-normal text-slate-400">(Optional)</span>
          </label>
          <input
            id="site.noticeUrl"
            name="site.noticeUrl"
            type="text"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="e.g. /events/bdaio-2026 or https://..."
            className="mt-1.5 w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm focus:border-bdaio-blue focus:outline-none focus:ring-2 focus:ring-bdaio-blue/30"
          />
        </div>

        {/* Preview Box */}
        <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4">
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
            Live Preview ({type === "modal" ? "Popup Modal" : "Topbar Banner"})
          </p>
          <div className="mt-2.5">
            {type === "modal" ? (
              <div className="mx-auto max-w-sm rounded-2xl bg-white p-5 shadow-lg ring-1 ring-slate-200">
                <div className="flex items-center gap-2">
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-bdaio-blue/10 text-base">
                    📣
                  </span>
                  <p className="font-bold text-slate-900">{title || "Notice Title"}</p>
                </div>
                <p className="mt-2 text-xs leading-relaxed text-slate-600">
                  {text || "Your announcement message will appear here."}
                </p>
                {url && (
                  <span className="mt-3 inline-block rounded-lg bg-bdaio-blue px-3 py-1.5 text-xs font-semibold text-white">
                    Learn More →
                  </span>
                )}
              </div>
            ) : (
              <div className="rounded-lg bg-gradient-to-r from-bdaio-blue to-indigo-700 px-4 py-2.5 text-center text-xs font-medium text-white shadow-xs">
                <span>{text || "Your announcement banner text will appear here."}</span>
                {url && (
                  <span className="ml-2 font-bold underline underline-offset-2">
                    Learn More →
                  </span>
                )}
              </div>
            )}
          </div>
        </div>

        {state?.message && (
          <p
            role={state.success ? "status" : "alert"}
            className={`rounded-lg px-3.5 py-2.5 text-xs font-medium ${
              state.success ? "bg-emerald-50 text-emerald-800" : "bg-red-50 text-red-700"
            }`}
          >
            {state.message}
          </p>
        )}

        <Button type="submit" disabled={pending} className="w-full sm:w-auto">
          {pending ? "Saving & Broadcasting..." : "Save & Broadcast Notice"}
        </Button>
      </form>
    </div>
  );
}
