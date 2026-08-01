import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { EventCard } from "@/components/events/EventCard";
import { metaDescription, pageMetadata } from "@/lib/seo";

export async function generateMetadata(
  props: PageProps<"/programs/[slug]">,
): Promise<Metadata> {
  const { slug } = await props.params;
  const program = await db.program.findUnique({
    where: { slug },
    select: { title: true, description: true, active: true, updatedAt: true },
  });
  if (!program) return { title: "Program not found", robots: { index: false } };
  return pageMetadata({
    title: program.title,
    description: metaDescription(program.description),
    path: `/programs/${slug}`,
    index: program.active,
    modifiedTime: program.updatedAt,
  });
}

export default async function ProgramPage(props: PageProps<"/programs/[slug]">) {
  const { slug } = await props.params;

  const program = await db.program.findUnique({
    where: { slug },
    include: {
      events: {
        where: { status: { not: "DRAFT" } },
        orderBy: [{ year: "desc" }, { startsAt: "asc" }],
        include: { program: { select: { title: true, slug: true } } },
      },
    },
  });

  if (!program || !program.active) notFound();

  const current = program.events.filter((e) => e.status !== "ARCHIVED");
  const past = program.events.filter((e) => e.status === "ARCHIVED");

  return (
    <section className="bg-slate-50/50 py-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <header className="mx-auto max-w-3xl text-center">
          <h1 className="text-4xl font-black text-bdaio-blue sm:text-5xl">
            {program.title}
          </h1>
          {program.titleBn && (
            <p className="font-bengali mt-1 text-lg text-slate-500">
              {program.titleBn}
            </p>
          )}
          {program.description && (
            <p className="mt-4 text-lg text-slate-600">{program.description}</p>
          )}
          {program.isExternal && (
            <p className="mx-auto mt-6 max-w-xl rounded-lg bg-white px-4 py-3 text-sm text-slate-600 ring-1 ring-slate-200">
              BdAIO nominates the Bangladesh team for this competition based on
              national results — there is no open registration.
            </p>
          )}
        </header>

        {current.length > 0 && (
          <div className="mt-12">
            <h2 className="text-lg font-bold text-slate-900">Current & upcoming</h2>
            <div className="mt-4 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {current.map((event) => (
                <EventCard key={event.id} event={event} />
              ))}
            </div>
          </div>
        )}

        {past.length > 0 && (
          <div className="mt-12">
            <h2 className="text-lg font-bold text-slate-900">Past editions</h2>
            <div className="mt-4 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {past.map((event) => (
                <EventCard key={event.id} event={event} />
              ))}
            </div>
          </div>
        )}

        {program.events.length === 0 && (
          <p className="mt-12 text-center text-sm text-slate-500">
            No editions have been published for this program yet.
          </p>
        )}
      </div>
    </section>
  );
}
