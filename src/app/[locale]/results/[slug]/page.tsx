import type { Metadata } from "next";
import { Link } from "@/components/Link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { MedalChip } from "@/components/results/MedalChip";
import { pageMetadata } from "@/lib/seo";
import { PAGE } from "@/lib/layout";

export const revalidate = 60;

export async function generateMetadata(
  props: PageProps<"/[locale]/results/[slug]">,
): Promise<Metadata> {
  const { locale, slug } = await props.params;
  const event = await db.event.findUnique({
    where: { slug },
    select: { title: true },
  });
  if (!event) return { title: "Results not found", robots: { index: false } };
  return pageMetadata({
    locale,
    title: `${event.title} results`,
    description: `Published standings and medallists for ${event.title}.`,
    path: `/results/${slug}`,
  });
}

/** Shows a participant's name only if they chose a public profile. */
function displayName(profile: {
  fullName: string;
  handle: string | null;
  visibility: string;
  dateOfBirth: Date | null;
} | null): { label: string; handle: string | null } {
  if (!profile) return { label: "Participant", handle: null };
  if (profile.visibility !== "PUBLIC") {
    // Not opted in: initials only, so a leaderboard never outs someone.
    const initials = profile.fullName
      .split(/\s+/)
      .map((p) => p[0]?.toUpperCase() ?? "")
      .join(".");
    return { label: `${initials}.`, handle: null };
  }
  return { label: profile.fullName, handle: profile.handle };
}

export default async function EventResultsPage(
  props: PageProps<"/[locale]/results/[slug]">,
) {
  const { slug } = await props.params;

  const event = await db.event.findUnique({
    where: { slug },
    include: {
      program: { select: { title: true } },
      rounds: {
        where: { results: { some: { published: true } } },
        orderBy: { order: "asc" },
        include: {
          results: {
            // Only published rows are ever read here.
            where: { published: true },
            orderBy: [{ rank: "asc" }, { marks: "desc" }],
            include: {
              registration: {
                include: {
                  user: {
                    select: {
                      profile: {
                        select: {
                          fullName: true,
                          handle: true,
                          visibility: true,
                          dateOfBirth: true,
                          institution: { select: { name: true, slug: true } },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
  });

  if (!event || event.rounds.length === 0) notFound();

  return (
    <section className="bg-slate-50/50 py-16">
      <div className={PAGE}>
        <Link href="/results" className="text-sm font-medium text-bdaio-blue hover:underline">
          ← Results
        </Link>

        <h1 className="mt-4 text-3xl font-black text-bdaio-blue sm:text-4xl">
          {event.title}
        </h1>
        <p className="mt-1 text-slate-600">{event.program.title}</p>

        {event.rounds.map((round) => {
          const showAward = round.results.some((r) => r.medal != null);
          const showRemarks = round.results.some((r) => Boolean(r.remarks && r.remarks.trim()));

          return (
            <div key={round.id} className="mt-8">
              <h2 className="text-lg font-bold text-slate-900">{round.name}</h2>

              <div className="mt-3 overflow-x-auto rounded-xl bg-white shadow-sm ring-1 ring-slate-100">
                <table className="w-full min-w-[560px] text-left text-sm">
                  <thead className="border-b border-slate-100 bg-slate-50/70">
                    <tr>
                      <th className="px-4 py-3 font-semibold text-slate-700">Rank</th>
                      <th className="px-4 py-3 font-semibold text-slate-700">Participant</th>
                      <th className="px-4 py-3 font-semibold text-slate-700">Institution</th>
                      {showAward && <th className="px-4 py-3 font-semibold text-slate-700">Award</th>}
                      {showRemarks && <th className="px-4 py-3 font-semibold text-slate-700">Status / Remarks</th>}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {round.results.map((result) => {
                      const profile = result.registration.user.profile;
                      const shown = displayName(profile);
                      return (
                        <tr key={result.id}>
                          <td className="px-4 py-3 font-semibold text-slate-900">
                            {result.rank ? `#${result.rank}` : "—"}
                          </td>
                          <td className="px-4 py-3">
                            {shown.handle ? (
                              <Link
                                href={`/u/${shown.handle}`}
                                className="font-medium text-bdaio-blue hover:underline"
                              >
                                {shown.label}
                              </Link>
                            ) : (
                              <span className="text-slate-800">{shown.label}</span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-slate-600">
                            {profile?.institution ? (
                              <Link
                                href={`/institutions/${profile.institution.slug}`}
                                className="hover:text-bdaio-blue hover:underline"
                              >
                                {profile.institution.name}
                              </Link>
                            ) : (
                              "—"
                            )}
                          </td>
                          {showAward && (
                            <td className="px-4 py-3">
                              {result.medal ? <MedalChip medal={result.medal} /> : "—"}
                            </td>
                          )}
                          {showRemarks && (
                            <td className="px-4 py-3">
                              {result.remarks ? (
                                <span className="inline-flex items-center rounded-full bg-blue-50 px-2.5 py-1 text-xs font-semibold text-bdaio-blue ring-1 ring-blue-200">
                                  {result.remarks}
                                </span>
                              ) : (
                                "—"
                              )}
                            </td>
                          )}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          );
        })}

        <p className="mt-8 text-xs text-slate-500">
          Participants who have not made their profile public are shown by
          initials only.
        </p>
      </div>
    </section>
  );
}
