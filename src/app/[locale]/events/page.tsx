import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { dictionaryFor, getDictionary, isLocale } from "@/lib/i18n";
import { EventCard } from "@/components/events/EventCard";
import { pageMetadata } from "@/lib/seo";

export async function generateMetadata(
  { params }: PageProps<"/[locale]/events">,
): Promise<Metadata> {
  const { locale } = await params;
  const meta = dictionaryFor(locale).pages.events;
  return pageMetadata({
    locale,
    path: "/events",
    title: meta.title,
    description:
    "Upcoming BdAIO olympiad rounds, workshops, seminars, and courses — and the archive of past events."
  });
}

// This list is database-driven, so it must not be frozen at build time.
// Re-render at most once a minute; admin changes appear without a redeploy.
export const revalidate = 60;

export default async function EventsPage({ params }: PageProps<"/[locale]/events">) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const t = getDictionary(locale).pages.events;

  const events = await db.event.findMany({
    where: { status: { not: "DRAFT" } },
    orderBy: [{ startsAt: "asc" }, { year: "desc" }],
    include: { program: { select: { title: true, slug: true } } },
  });

  const upcoming = events.filter((e) => e.status !== "ARCHIVED");
  const past = events.filter((e) => e.status === "ARCHIVED");

  return (
    <section className="bg-slate-50/50 py-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto mb-12 max-w-3xl text-center">
          <h1 className="text-4xl font-black text-bdaio-blue sm:text-5xl">
            {t.title}
          </h1>
          <p className="mt-3 text-lg text-slate-500">{t.lead}</p>
          <div className="mx-auto mt-6 h-1 w-20 rounded bg-bdaio-blue-light" />
        </div>

        {upcoming.length > 0 ? (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {upcoming.map((event) => (
              <EventCard key={event.id} event={event} />
            ))}
          </div>
        ) : (
          <p className="text-center text-sm text-slate-500">{t.empty}</p>
        )}

        {past.length > 0 && (
          <div className="mt-14">
            <h2 className="text-lg font-bold text-slate-900">{t.past}</h2>
            <div className="mt-4 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {past.map((event) => (
                <EventCard key={event.id} event={event} />
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
