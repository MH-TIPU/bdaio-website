"use client";

import { useState } from "react";
import Link from "next/link";
import type { Locale } from "@/lib/i18n/config";

export function SiteNotice({
  text,
  type = "topbar",
  title = "Announcement",
  url,
}: {
  locale?: Locale;
  text: string;
  type?: string;
  title?: string;
  url?: string;
}) {
  const [dismissed, setDismissed] = useState(false);

  if (!text || dismissed) return null;

  // --- POPUP MODAL MODE ---
  if (type === "modal") {
    return (
      <div
        role="dialog"
        aria-modal="true"
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn"
      >
        <div className="relative w-full max-w-lg overflow-hidden rounded-3xl bg-white p-6 shadow-2xl ring-1 ring-slate-900/10 sm:p-8">
          {/* Close X Button */}
          <button
            type="button"
            onClick={() => setDismissed(true)}
            className="absolute top-4 right-4 flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 hover:text-slate-900 transition"
            aria-label="Close announcement"
          >
            ✕
          </button>

          <div className="flex items-start gap-4">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-bdaio-blue/10 text-2xl">
              📣
            </span>
            <div className="min-w-0 flex-1 pr-6">
              <h3 className="text-xl font-bold text-slate-900">{title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-600 whitespace-pre-wrap">
                {text}
              </p>

              <div className="mt-6 flex flex-wrap items-center gap-3">
                {url && (
                  <Link
                    href={url}
                    onClick={() => setDismissed(true)}
                    className="rounded-xl bg-bdaio-blue px-4 py-2.5 text-sm font-semibold text-white hover:bg-bdaio-blue-dark transition"
                  >
                    View Details →
                  </Link>
                )}
                <button
                  type="button"
                  onClick={() => setDismissed(true)}
                  className="rounded-xl bg-slate-100 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-200 transition"
                >
                  Dismiss
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // --- TOPBAR BANNER MODE ---
  return (
    <div
      role="status"
      className="relative bg-gradient-to-r from-bdaio-blue via-indigo-700 to-bdaio-blue text-white shadow-xs"
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-2 text-sm font-medium sm:px-6 lg:px-8">
        <div className="flex flex-1 flex-wrap items-center justify-center gap-2 text-center">
          <span>{text}</span>
          {url && (
            <Link
              href={url}
              className="inline-flex items-center gap-1 font-bold underline underline-offset-2 hover:text-amber-200"
            >
              Learn More →
            </Link>
          )}
        </div>
        <button
          type="button"
          onClick={() => setDismissed(true)}
          className="rounded-md p-1 text-white/80 hover:bg-white/10 hover:text-white transition"
          aria-label="Dismiss banner"
        >
          ✕
        </button>
      </div>
    </div>
  );
}
