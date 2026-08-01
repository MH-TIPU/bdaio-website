import type { Metadata } from "next";
import { db } from "@/lib/db";
import { EventCard } from "@/components/events/EventCard";
import { pageMetadata } from "@/lib/seo";

export async function generateMetadata(
  { params }: PageProps<"/[locale]/workshops">,
): Promise<Metadata> {
  const { locale } = await params;
  return pageMetadata({
    locale,
    path: "/workshops",
    title: "Workshops & Courses",
    description:
    "Hands-on BdAIO workshops, seminars, courses, and bootcamps — online and in person across Bangladesh."
  });
}

// Database-driven: re-render at most once a minute rather than freezing at build.
export const revalidate = 60;

// Workshops are ordinary Events; this page is the same data filtered to the
// learning-oriented types.
const LEARNING_TYPES = ["WORKSHOP", "SEMINAR", "COURSE", "BOOTCAMP"] as const;

export default async function WorkshopsPage() {
  const events = await db.event.findMany({
    where: { type: { in: [...LEARNING_TYPES] }, status: { not: "DRAFT" } },
    orderBy: [{ startsAt: "asc" }],
    include: { program: { select: { title: true, slug: true } } },
  });

  const upcoming = events.filter((e) => e.status !== "ARCHIVED");
  const past = events.filter((e) => e.status === "ARCHIVED");

  return (
    <section className="bg-slate-50/50 py-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto mb-12 max-w-3xl text-center">
          <h1 className="text-4xl font-black text-bdaio-blue sm:text-5xl">
            Workshops & Courses
          </h1>
          <p className="mt-3 text-lg text-slate-500">
            Hands-on sessions to build the skills the olympiad asks for — open to
            everyone with a BdAIO account.
          </p>
          <div className="mx-auto mt-6 h-1 w-20 rounded bg-blue-500" />
        </div>

        {upcoming.length > 0 ? (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {upcoming.map((event) => (
              <EventCard key={event.id} event={event} />
            ))}
          </div>
        ) : (
          <p className="text-center text-sm text-slate-500">
            No workshops are scheduled right now. Please check back soon.
          </p>
        )}

        {past.length > 0 && (
          <div className="mt-14">
            <h2 className="text-lg font-bold text-slate-900">Past sessions</h2>
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
