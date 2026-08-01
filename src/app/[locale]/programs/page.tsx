import type { Metadata } from "next";
import { Link } from "@/components/Link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { dictionaryFor, getDictionary, isLocale } from "@/lib/i18n";
import { pageMetadata } from "@/lib/seo";

export async function generateMetadata(
  { params }: PageProps<"/[locale]/programs">,
): Promise<Metadata> {
  const { locale } = await params;
  const meta = dictionaryFor(locale).pages.programs;
  return pageMetadata({
    locale,
    path: "/programs",
    title: meta.title,
    description:
    "The olympiads, competitions, and workshop series run by BdAIO — and the international competitions we nominate students to."
  });
}

// Database-driven: re-render at most once a minute rather than freezing at build.
export const revalidate = 60;

const SCOPE_LABELS = {
  LOCAL: "Local",
  NATIONAL: "National",
  REGIONAL: "Regional",
  INTERNATIONAL: "International",
} as const;

export default async function ProgramsPage({ params }: PageProps<"/[locale]/programs">) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const t = getDictionary(locale).pages.programs;

  const programs = await db.program.findMany({
    where: { active: true },
    orderBy: [{ isExternal: "asc" }, { title: "asc" }],
    include: {
      _count: { select: { events: true } },
      events: {
        where: { status: { in: ["OPEN", "RUNNING"] } },
        select: { id: true },
      },
    },
  });

  return (
    <section className="bg-slate-50/50 py-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto mb-12 max-w-3xl text-center">
          <h1 className="text-4xl font-black text-bdaio-blue sm:text-5xl">
            {t.title}
          </h1>
          <p className="mt-4 text-lg text-slate-600">{t.lead}</p>
        </div>

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {programs.map((program) => (
            <Link
              key={program.id}
              href={`/programs/${program.slug}`}
              className="flex flex-col rounded-xl bg-white p-6 shadow-sm ring-1 ring-slate-100 transition-shadow hover:shadow-md"
            >
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-bdaio-blue/10 px-2.5 py-0.5 text-xs font-semibold text-bdaio-blue">
                  {SCOPE_LABELS[program.scope]}
                </span>
                {program.isExternal && (
                  <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-600">
                    By nomination
                  </span>
                )}
              </div>

              <h2 className="mt-3 text-lg font-bold text-slate-900">
                {program.title}
              </h2>
              {program.titleBn && (
                <p className="font-bengali text-sm text-slate-500">
                  {program.titleBn}
                </p>
              )}

              {program.description && (
                <p className="mt-2 flex-1 text-sm text-slate-600">
                  {program.description}
                </p>
              )}

              <p className="mt-4 text-xs font-medium text-slate-500">
                {program._count.events}{" "}
                {program._count.events === 1 ? "edition" : "editions"}
                {program.events.length > 0 && (
                  <span className="text-emerald-700">
                    {" "}
                    · {program.events.length} open now
                  </span>
                )}
              </p>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
