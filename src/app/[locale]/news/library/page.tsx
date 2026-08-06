import type { Metadata } from "next";
import { Link } from "@/components/Link";
import { newsLinks } from "@/data/news";
import { pageMetadata } from "@/lib/seo";
import { dictionaryFor } from "@/lib/i18n";

export async function generateMetadata(
  { params }: PageProps<"/[locale]/news/library">,
): Promise<Metadata> {
  const { locale } = await params;
  return pageMetadata({
    locale,
    path: "/news/library",
    title: "News Link Library",
    description: "External media coverage links for Bangladesh Artificial Intelligence Olympiad."
  });
}

export default async function NewsLibraryPage({ params }: PageProps<"/[locale]/news/library">) {
  const { locale } = await params;
  const common = dictionaryFor(locale).common;
  return (
    <section className="bg-white py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-10">
          <Link
            href="/news"
            className="inline-flex items-center gap-2 text-sm font-bold text-[#1e5a8a] hover:underline"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
            </svg>
            Back to News
          </Link>
        </div>

        <div className="mx-auto mb-14 max-w-3xl text-center">
          <span className="text-sm font-extrabold uppercase tracking-widest text-blue-500">
            Media Coverage
          </span>
          <h1 className="mt-3 text-4xl font-black text-[#1e5a8a] sm:text-5xl">
            News Link Library
          </h1>
          <p className="mt-4 text-base leading-relaxed text-slate-500 sm:text-lg">
            Direct links to published BdAIO coverage from newspapers, online portals, and partner media.
          </p>
          <div className="mx-auto mt-6 h-1 w-20 rounded bg-blue-500" />
        </div>

        {newsLinks.length > 0 ? (
          <div className="space-y-4">
            {newsLinks.map((item) => (
              <a
                key={item.url}
                href={item.url}
                target="_blank"
                rel="noreferrer"
                className="group block rounded-2xl border border-slate-100 bg-slate-50/60 p-5 transition hover:border-blue-100 hover:bg-white hover:shadow-md"
              >
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <div className="mb-2 flex flex-wrap items-center gap-2">
                      <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-blue-600">
                        {item.source}
                      </span>
                      <time className="text-xs font-semibold text-slate-500">
                        {item.publishedAt}
                      </time>
                    </div>
                    <h2 className="text-lg font-black leading-snug text-slate-800 group-hover:text-[#1e5a8a]">
                      {item.title}
                    </h2>
                    {item.summary ? (
                      <p className="mt-2 text-sm leading-relaxed text-slate-500">
                        {item.summary}
                      </p>
                    ) : null}
                  </div>
                  <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white text-[#1e5a8a] shadow-sm transition group-hover:bg-[#1e5a8a] group-hover:text-white">
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5H21m0 0V12m0-7.5L10.5 15M6 6h4.5M6 18h12" />
                    </svg>
                  </span>
                </div>
              </a>
            ))}
          </div>
        ) : (
          <div className="mx-auto max-w-2xl rounded-2xl border border-dashed border-slate-200 bg-slate-50/70 px-6 py-12 text-center">
            <h2 className="text-xl font-black text-slate-800">{common.noExternalLinks}</h2>
            <p className="mt-3 text-sm leading-relaxed text-slate-500">
              Published links from outlets such as Prothom Alo, Kaler Kantho, and other media will appear here.
            </p>
          </div>
        )}
      </div>
    </section>
  );
}
