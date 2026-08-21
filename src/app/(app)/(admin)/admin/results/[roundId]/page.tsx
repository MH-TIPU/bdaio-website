import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import {
  assignJudge,
  publishRoundResults,
  removeJudge,
} from "@/server/results/actions";
import { ScoreForm, type ScoreRow } from "@/components/results/ScoreForm";
import { ImportScores } from "@/components/results/ImportScores";
import { formatBytes } from "@/lib/storage/submissions";

export const metadata: Metadata = { title: "Score round · Admin" };

export default async function ScoreRoundPage(
  props: PageProps<"/admin/results/[roundId]">,
) {
  const { roundId } = await props.params;

  const round = await db.round.findUnique({
    where: { id: roundId },
    include: {
      event: { select: { id: true, title: true, slug: true, year: true } },
      judges: {
        include: {
          user: { select: { email: true, profile: { select: { fullName: true } } } },
        },
      },
      results: true,
    },
  });
  if (!round) notFound();

  // Only approved entrants are scored.
  const registrations = await db.registration.findMany({
    where: { eventId: round.event.id, status: "APPROVED" },
    include: {
      user: {
        select: {
          email: true,
          profile: {
            select: { fullName: true, institution: { select: { name: true } } },
          },
        },
      },
    },
    orderBy: { createdAt: "asc" },
  });

  const byRegistration = new Map(round.results.map((r) => [r.registrationId, r]));

  // A judge cannot mark work they cannot read. Links go through
  // /api/submissions/[id], which re-checks that this judge is assigned to this
  // round — the page listing a link is never the authorisation.
  const submissions = await db.submission.findMany({
    where: { roundId: round.id },
    select: { id: true, registrationId: true, originalName: true, sizeBytes: true },
  });
  const submissionByRegistration = new Map(
    submissions.map((s) => [s.registrationId, s]),
  );

  const rows: ScoreRow[] = registrations.map((registration) => {
    const result = byRegistration.get(registration.id);
    return {
      registrationId: registration.id,
      name: registration.user.profile?.fullName ?? registration.user.email,
      email: registration.user.email,
      institution: registration.user.profile?.institution?.name ?? null,
      marks: result?.marks != null ? String(result.marks) : "",
      medal: result?.medal ?? "",
      remarks: result?.remarks ?? "",
      rank: result?.rank ?? null,
      submission: (() => {
        const found = submissionByRegistration.get(registration.id);
        return found
          ? {
              id: found.id,
              originalName: found.originalName,
              size: formatBytes(found.sizeBytes),
            }
          : null;
      })(),
    };
  });

  const published = round.results.some((r) => r.published);
  const maxMarks = round.results.find((r) => r.maxMarks != null)?.maxMarks;

  return (
    <>
      <Link
        href="/admin/results"
        className="text-sm font-medium text-bdaio-blue hover:underline"
      >
        ← Results
      </Link>

      <div className="mt-3 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">{round.name}</h1>
          <p className="mt-1 text-sm text-slate-600">
            {round.event.title} ({round.event.year})
          </p>
        </div>

        <form action={publishRoundResults}>
          <input type="hidden" name="roundId" value={round.id} />
          <input type="hidden" name="publish" value={published ? "0" : "1"} />
          <button
            type="submit"
            className={`rounded-lg px-4 py-2.5 text-sm font-semibold transition-colors ${
              published
                ? "bg-white text-red-600 ring-1 ring-red-200 hover:bg-red-50"
                : "bg-bdaio-blue text-white hover:bg-bdaio-blue-dark"
            }`}
          >
            {published ? "Unpublish results" : "Publish results"}
          </button>
        </form>
      </div>

      <p
        className={`mt-4 rounded-lg px-4 py-3 text-sm ${
          published ? "bg-emerald-50 text-emerald-800" : "bg-amber-50 text-amber-800"
        }`}
      >
        {published
          ? "These results are public. Participants can see their marks and medals."
          : "Marks are hidden from participants and the public until you publish."}
      </p>

      <div className="mt-6">
        <ScoreForm
          roundId={round.id}
          maxMarks={maxMarks != null ? String(maxMarks) : ""}
          rows={rows}
        />
      </div>

      <ImportScores
        roundId={round.id}
        published={round.results.some((r) => r.published)}
      />

      {/* Judges */}
      <div className="mt-8 rounded-xl bg-white p-5 shadow-sm ring-1 ring-slate-100">
        <h2 className="text-sm font-semibold text-slate-900">Judges for this round</h2>
        <p className="mt-1 text-xs text-slate-500">
          A judge can enter marks for this round only, and cannot publish.
        </p>

        {round.judges.length > 0 && (
          <ul className="mt-3 divide-y divide-slate-100">
            {round.judges.map((judge) => (
              <li key={judge.id} className="flex items-center justify-between gap-2 py-2">
                <span className="text-sm text-slate-800">
                  {judge.user.profile?.fullName ?? judge.user.email}
                  <span className="ml-1.5 text-xs text-slate-500">
                    {judge.user.email}
                  </span>
                </span>
                <form action={removeJudge}>
                  <input type="hidden" name="judgeId" value={judge.id} />
                  <button
                    type="submit"
                    className="rounded-lg px-2.5 py-1 text-xs font-semibold text-red-600 ring-1 ring-red-200 hover:bg-red-50"
                  >
                    Remove
                  </button>
                </form>
              </li>
            ))}
          </ul>
        )}

        <form action={assignJudge} className="mt-4 flex flex-wrap items-end gap-3">
          <input type="hidden" name="roundId" value={round.id} />
          <div className="min-w-[240px] flex-1">
            <label htmlFor="email" className="block text-sm font-medium text-slate-700">
              Assign by email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              placeholder="judge@example.com"
              className="mt-1.5 block w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm focus:border-bdaio-blue focus:outline-none focus:ring-2 focus:ring-bdaio-blue/30"
            />
          </div>
          <button
            type="submit"
            className="rounded-lg bg-white px-4 py-2.5 text-sm font-semibold text-bdaio-blue ring-1 ring-slate-200 transition-colors hover:bg-slate-50"
          >
            Assign judge
          </button>
        </form>
      </div>
    </>
  );
}
