import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "You are offline",
  description: "This page is shown when your device has no internet connection.",
  // Reachable only from the service worker's failure path; it should never be a
  // search result.
  robots: { index: false, follow: false },
};

/**
 * The offline fallback, precached by public/sw.js.
 *
 * Deliberately static and dependency-free: it has to render from the cache with
 * no network, so it cannot query the database or read a session. Bilingual,
 * because the people most likely to see it are on a patchy mobile connection.
 */
export default function OfflinePage() {
  return (
    <section className="bg-slate-50/50 py-20">
      <div className="mx-auto max-w-xl px-4 text-center sm:px-6 lg:px-8">
        <p className="text-5xl" aria-hidden="true">
          📡
        </p>
        <h1 className="mt-4 text-3xl font-black text-bdaio-blue sm:text-4xl">
          You are offline
        </h1>
        <p className="font-bengali mt-1 text-lg text-slate-500">
          আপনি অফলাইনে আছেন
        </p>

        <p className="mt-6 text-base leading-relaxed text-slate-600">
          We could not reach BdAIO because your device has no internet
          connection. Your work is not lost — reconnect and try again.
        </p>
        <p className="font-bengali mt-3 text-base leading-relaxed text-slate-600">
          ইন্টারনেট সংযোগ না থাকায় BdAIO-তে পৌঁছানো যায়নি। সংযোগ ফিরে এলে আবার
          চেষ্টা করুন।
        </p>

        <div className="mt-8 flex flex-wrap justify-center gap-3">
          {/* A plain link, not a router push: the app shell may not be loaded. */}
          <a
            href="/dashboard"
            className="rounded-lg bg-bdaio-blue px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-bdaio-blue-dark"
          >
            Try again
          </a>
          <Link
            href="/"
            className="rounded-lg bg-white px-5 py-2.5 text-sm font-semibold text-bdaio-blue ring-1 ring-slate-200 transition-colors hover:bg-slate-50"
          >
            Home
          </Link>
        </div>
      </div>
    </section>
  );
}
