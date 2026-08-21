import type { Metadata } from "next";
import { Link } from "@/components/Link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { dictionaryFor, getDictionary, isLocale } from "@/lib/i18n";
import { pageMetadata } from "@/lib/seo";
import { PAGE } from "@/lib/layout";

export async function generateMetadata(
  { params }: PageProps<"/results">,
): Promise<Metadata> {
  const locale = "en";
  const meta = dictionaryFor(locale).pages.results;
  return pageMetadata({
    locale,
    path: "/results",
    title: meta.title,
    description:
    "Published results and medallists from the Bangladesh AI Olympiad and related competitions."
  });
}

export const revalidate = 60;

export default async function ResultsIndexPage({ params }: PageProps<"/results">) {
  const locale = "en";
  
  const t = getDictionary(locale).pages.results;

  // An event appears here only once at least one of its rounds is published.
  const events = await db.event.findMany({
    where: { rounds: { some: { results: { some: { published: true } } } } },
    orderBy: [{ year: "desc" }, { title: "asc" }],
    include: {
      program: { select: { title: true } },
      rounds: {
        where: { results: { some: { published: true } } },
        select: {
          name: true,
          _count: { select: { results: { where: { published: true } } } },
        },
        orderBy: { order: "asc" },
      },
    },
  });

  return (
    <section className="bg-slate-50/50 py-16">
      <div className={PAGE}>
        <div className="mx-auto mb-10 max-w-3xl text-center">
          <h1 className="text-4xl font-black text-bdaio-blue sm:text-5xl">{t.title}</h1>
          <p className="mt-3 text-lg text-slate-500">{t.lead}</p>
          <div className="mx-auto mt-6 h-1 w-20 rounded bg-bdaio-blue-light" />
        </div>

        {events.length === 0 ? (
          <p className="text-center text-sm text-slate-500">{t.empty}</p>
        ) : (
          <ul className="space-y-4">
            {events.map((event) => (
              <li key={event.id}>
                <Link
                  href={`/results/${event.slug}`}
                  className="block rounded-xl bg-white p-5 shadow-sm ring-1 ring-slate-100 transition-shadow hover:shadow-md"
                >
                  <p className="text-lg font-bold text-slate-900">{event.title}</p>
                  <p className="text-sm text-slate-500">{event.program.title}</p>
                  <p className="mt-2 text-xs text-slate-500">
                    {event.rounds
                      .map((r) => `${r.name} (${r._count.results})`)
                      .join(" · ")}
                  </p>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
