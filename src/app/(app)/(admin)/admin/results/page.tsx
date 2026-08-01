import type { Metadata } from "next";
import Link from "next/link";
import { db } from "@/lib/db";

export const metadata: Metadata = { title: "Results · Admin" };

export default async function AdminResultsPage() {
  // Only olympiad-style events have rounds to score.
  const rounds = await db.round.findMany({
    orderBy: [{ event: { year: "desc" } }, { order: "asc" }],
    include: {
      event: { select: { title: true, year: true } },
      _count: { select: { registrations: true, results: true, judges: true } },
      results: { where: { published: true }, select: { id: true }, take: 1 },
    },
  });

  return (
    <>
      <h1 className="text-2xl font-bold text-slate-900">Results</h1>
      <p className="mt-1 text-sm text-slate-600">
        Enter marks per round. Nothing is visible to participants until you
        publish.
      </p>

      <div className="mt-6 overflow-x-auto rounded-xl bg-white shadow-sm ring-1 ring-slate-100">
        <table className="w-full min-w-[680px] text-left text-sm">
          <thead className="border-b border-slate-100 bg-slate-50/70">
            <tr>
              <th className="px-4 py-3 font-semibold text-slate-700">Round</th>
              <th className="px-4 py-3 font-semibold text-slate-700">Entries</th>
              <th className="px-4 py-3 font-semibold text-slate-700">Scored</th>
              <th className="px-4 py-3 font-semibold text-slate-700">Judges</th>
              <th className="px-4 py-3 font-semibold text-slate-700">State</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {rounds.map((round) => (
              <tr key={round.id}>
                <td className="px-4 py-3">
                  <p className="font-medium text-slate-900">{round.name}</p>
                  <p className="text-xs text-slate-500">
                    {round.event.title} ({round.event.year})
                  </p>
                </td>
                <td className="px-4 py-3 text-slate-700">
                  {round._count.registrations}
                </td>
                <td className="px-4 py-3 text-slate-700">{round._count.results}</td>
                <td className="px-4 py-3 text-slate-700">{round._count.judges}</td>
                <td className="px-4 py-3">
                  {round.results.length > 0 ? (
                    <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700">
                      Published
                    </span>
                  ) : round._count.results > 0 ? (
                    <span className="rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-semibold text-amber-800">
                      Draft
                    </span>
                  ) : (
                    <span className="text-xs text-slate-400">Not started</span>
                  )}
                </td>
                <td className="px-4 py-3 text-right">
                  <Link
                    href={`/admin/results/${round.id}`}
                    className="text-sm font-semibold text-bdaio-blue hover:underline"
                  >
                    Score
                  </Link>
                </td>
              </tr>
            ))}
            {rounds.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-slate-500">
                  No rounds exist yet. Add rounds to an event first.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}
