import type { Metadata } from "next";
import { Link } from "@/components/Link";
import { newsPosts } from "@/data/news";
import { pageMetadata } from "@/lib/seo";
import { notFound } from "next/navigation";
import { getDictionary, isLocale } from "@/lib/i18n";

export async function generateMetadata(
  { params }: PageProps<"/[locale]/news">,
): Promise<Metadata> {
  const { locale } = await params;
  return pageMetadata({
    locale,
    path: "/news",
    title: "News",
    description: "Official news and media updates from Bangladesh Artificial Intelligence Olympiad."
  });
}

export default async function NewsPage({ params }: PageProps<"/[locale]/news">) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const dict = getDictionary(locale);
  const t = dict.pages.news;
  const common = dict.common;

  return (
    <section className="bg-slate-50/50 py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto mb-14 max-w-3xl text-center">
          <span className="text-sm font-extrabold uppercase tracking-widest text-blue-500">
            {t.kicker}
          </span>
          <h1 className="mt-3 text-4xl font-black text-[#1e5a8a] sm:text-5xl">
            {t.title}
          </h1>
          <p className="mt-4 text-base leading-relaxed text-slate-500 sm:text-lg">
            {t.lead}
          </p>
          <div className="mx-auto mt-6 h-1 w-20 rounded bg-blue-500" />
        </div>

        <div className="mb-10 flex justify-center">
          <Link
            href="/news/library"
            className="inline-flex items-center gap-2 rounded-xl bg-[#1e5a8a] px-6 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-[#0d3d6b] hover:shadow-md"
          >
            {t.libraryCta}
            <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5H21m0 0V12m0-7.5L10.5 15M6 6h4.5M6 18h12" />
            </svg>
          </Link>
        </div>

        <div className="mx-auto mb-12 max-w-4xl rounded-2xl border border-blue-100 bg-white/85 p-6 shadow-sm backdrop-blur">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-lg font-black text-slate-800">{t.coverageTitle}</h2>
              <p className="mt-2 text-sm leading-relaxed text-slate-500">
                {t.coverageBody}
              </p>
            </div>
            <Link
              href="/news/library"
              className="inline-flex shrink-0 items-center justify-center rounded-xl border border-[#1e5a8a] px-5 py-2.5 text-sm font-bold text-[#1e5a8a] transition hover:bg-[#1e5a8a] hover:text-white"
            >
              {t.openLibrary}
            </Link>
          </div>
        </div>

        {newsPosts.length > 0 ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {newsPosts.map((post) => (
              <article
                key={post.slug}
                className="flex min-h-64 flex-col rounded-2xl border border-slate-100 bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
              >
                <div className="mb-4 flex items-center justify-between gap-3">
                  <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-blue-600">
                    {post.category}
                  </span>
                  <time className="text-xs font-semibold text-slate-500">{post.date}</time>
                </div>
                <h2 className="text-xl font-black leading-snug text-slate-800">
                  {post.title}
                </h2>
                <p className="mt-3 flex-1 text-sm leading-relaxed text-slate-500">
                  {post.excerpt}
                </p>
                <Link
                  href={`/news/${post.slug}`}
                  className="mt-6 text-sm font-bold text-[#1e5a8a] hover:underline"
                >
                  {common.readMore}
                </Link>
              </article>
            ))}
          </div>
        ) : (
          <div className="mx-auto max-w-2xl rounded-2xl border border-dashed border-slate-200 bg-white px-6 py-12 text-center shadow-sm">
            <h2 className="text-xl font-black text-slate-800">{t.emptyTitle}</h2>
            <p className="mt-3 text-sm leading-relaxed text-slate-500">
              {t.emptyBody}
            </p>
          </div>
        )}
      </div>
    </section>
  );
}
