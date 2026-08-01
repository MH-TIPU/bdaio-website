import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { RetryButton } from "@/components/RetryButton";
import { getDictionary, isLocale, localePath } from "@/lib/i18n";

export const metadata: Metadata = {
  title: "You are offline",
  description: "This page is shown when your device has no internet connection.",
  // Reachable only from the service worker's failure path; it should never be a
  // search result.
  robots: { index: false, follow: false },
};

/**
 * The offline fallback, precached by public/sw.js — one copy per locale, because
 * a service worker cannot read cookies and so takes the language from the path of
 * the request that failed.
 *
 * Deliberately static and dependency-free beyond the dictionary: it has to render
 * from the cache with no network, so it cannot query the database or read a
 * session.
 */
export default async function OfflinePage({ params }: PageProps<"/[locale]/offline">) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const t = getDictionary(locale);

  return (
    <section className="bg-slate-50/50 py-20">
      <div className="mx-auto max-w-xl px-4 text-center sm:px-6 lg:px-8">
        <p className="text-5xl" aria-hidden="true">
          📡
        </p>
        <h1 className="mt-4 text-3xl font-black text-bdaio-blue sm:text-4xl">
          {t.offline.title}
        </h1>

        <p className="mt-6 text-base leading-relaxed text-slate-600">
          {t.offline.body}
        </p>

        <div className="mt-8 flex flex-wrap justify-center gap-3">
          {/* A reload, not a link: the useful action is retrying the page they
              were actually on, and a link would fail the same way. */}
          <RetryButton label={t.common.tryAgain} />
          <Link
            href={localePath(locale, "/")}
            className="rounded-lg bg-white px-5 py-2.5 text-sm font-semibold text-bdaio-blue ring-1 ring-slate-200 transition-colors hover:bg-slate-50"
          >
            {t.nav.home}
          </Link>
        </div>
      </div>
    </section>
  );
}
