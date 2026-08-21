import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth/dal";
import { ScoreForm, type ScoreRow } from "@/components/results/ScoreForm";
import { formatBytes } from "@/lib/storage/submissions";

export const metadata: Metadata = { title: "Judging" };

/**
 * A judge's own scoring view. Deliberately has no publish control — scoring and
 * publishing are separate authorities.
 */
export default async function JudgingPage() {
  const user = await requireUser();

  const assignments = await db.roundJudge.findMany({
    where: { userId: user.id },
    include: {
      round: {
        include: {
          event: { select: { id: true, title: true, year: true } },
          results: true,
        },
      },
    },
    orderBy: { assignedAt: "desc" },
  });

  // Nothing assigned and not staff → this page isn't for them.
  const isStaff = user.role === "ADMIN" || user.role === "SUPER_ADMIN";
  if (assignments.length === 0 && !isStaff) notFound();

  const sheets = await Promise.all(
    assignments.map(async (assignment) => {
      const registrations = await db.registration.findMany({
        where: { eventId: assignment.round.event.id, status: "APPROVED" },
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

      const byRegistration = new Map(
        assignment.round.results.map((r) => [r.registrationId, r]),
      );

      // A judge marks what they can read. The link is authorised again inside
      // /api/submissions/[id] against this judge's round assignment.
      const submissions = await db.submission.findMany({
        where: { roundId: assignment.round.id },
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

      const maxMarks = assignment.round.results.find((r) => r.maxMarks != null)?.maxMarks;
      const published = assignment.round.results.some((r) => r.published);

      return { assignment, rows, maxMarks, published };
    }),
  );

  return (
    <>
      <h1 className="text-2xl font-bold text-slate-900">Judging</h1>
      <p className="mt-1 text-sm text-slate-600">
        Rounds you have been assigned to score. BdAIO staff decide when results
        are published.
      </p>

      {sheets.length === 0 ? (
        <p className="mt-6 rounded-xl bg-white px-4 py-8 text-center text-sm text-slate-500 shadow-sm ring-1 ring-slate-100">
          You have not been assigned to any rounds.
        </p>
      ) : (
        <div className="mt-6 space-y-10">
          {sheets.map(({ assignment, rows, maxMarks, published }) => (
            <section key={assignment.id}>
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <h2 className="text-lg font-bold text-slate-900">
                  {assignment.round.name}
                </h2>
                <span
                  className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                    published
                      ? "bg-emerald-50 text-emerald-700"
                      : "bg-amber-50 text-amber-800"
                  }`}
                >
                  {published ? "Published" : "Draft"}
                </span>
              </div>
              <p className="mb-3 text-sm text-slate-600">
                {assignment.round.event.title} ({assignment.round.event.year})
              </p>
              <ScoreForm
                roundId={assignment.round.id}
                maxMarks={maxMarks != null ? String(maxMarks) : ""}
                rows={rows}
              />
            </section>
          ))}
        </div>
      )}
    </>
  );
}
