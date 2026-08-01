import type { Metadata } from "next";
import Link from "next/link";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth/dal";
import { MedalChip } from "@/components/results/MedalChip";

export const metadata: Metadata = { title: "My Results" };

export default async function MyResultsPage() {
  const user = await requireUser();

  // `published: true` is the gate — a participant never sees draft marks.
  const results = await db.result.findMany({
    where: { published: true, registration: { userId: user.id } },
    orderBy: [{ publishedAt: "desc" }],
    include: {
      round: {
        select: { name: true, event: { select: { title: true, slug: true, year: true } } },
      },
    },
  });

  return (
    <>
      <h1 className="text-2xl font-bold text-slate-900">My Results</h1>
      <p className="mt-1 text-sm text-slate-600">
        Marks and medals from rounds you took part in.
      </p>

      {results.length === 0 ? (
        <p className="mt-6 rounded-xl bg-white px-4 py-8 text-center text-sm text-slate-500 shadow-sm ring-1 ring-slate-100">
          No results published yet. They appear here once BdAIO publishes a round
          you entered.
        </p>
      ) : (
        <ul className="mt-6 space-y-4">
          {results.map((result) => (
            <li
              key={result.id}
              className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-slate-100"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-base font-bold text-slate-900">
                    {result.round.name}
                  </p>
                  <Link
                    href={`/results/${result.round.event.slug}`}
                    className="text-sm text-slate-600 hover:text-bdaio-blue hover:underline"
                  >
                    {result.round.event.title} ({result.round.event.year})
                  </Link>
                </div>
                {result.medal && <MedalChip medal={result.medal} />}
              </div>

              <dl className="mt-4 grid grid-cols-2 gap-4 border-t border-slate-100 pt-4 sm:grid-cols-3">
                <div>
                  <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">
                    Marks
                  </dt>
                  <dd className="mt-0.5 text-lg font-bold text-slate-900">
                    {result.marks ?? "—"}
                    {result.maxMarks != null && result.marks != null && (
                      <span className="text-sm font-normal text-slate-500">
                        {" "}
                        / {result.maxMarks}
                      </span>
                    )}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">
                    Rank
                  </dt>
                  <dd className="mt-0.5 text-lg font-bold text-slate-900">
                    {result.rank ? `#${result.rank}` : "—"}
                  </dd>
                </div>
                {result.remarks && (
                  <div className="col-span-2 sm:col-span-1">
                    <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">
                      Remarks
                    </dt>
                    <dd className="mt-0.5 text-sm text-slate-700">{result.remarks}</dd>
                  </div>
                )}
              </dl>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
