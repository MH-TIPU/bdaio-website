import type { Metadata } from "next";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth/dal";
import {
  submissionClosedMessage,
  submissionWindow,
} from "@/lib/events/submissions";
import {
  ALLOWED_SUBMISSION_EXTENSIONS,
  MAX_SUBMISSION_BYTES,
  formatBytes,
} from "@/lib/storage/submissions";
import { SubmitForm } from "./SubmitForm";

export const metadata: Metadata = { title: "My submissions" };

/**
 * Where an entrant hands in work.
 *
 * Lists every round that collects submissions and belongs to an event they are
 * **approved** for. Rounds whose window has not opened, or has closed, are still
 * shown with the reason — a page that simply omits them leaves an entrant unsure
 * whether they have missed something or the organisers have not set it up.
 */
export default async function SubmissionsPage() {
  const user = await requireUser();

  const registrations = await db.registration.findMany({
    where: { userId: user.id, status: "APPROVED" },
    select: {
      id: true,
      event: {
        select: {
          title: true,
          year: true,
          rounds: {
            where: { allowSubmissions: true },
            orderBy: { order: "asc" },
            select: {
              id: true,
              name: true,
              allowSubmissions: true,
              submissionsOpenAt: true,
              submissionsCloseAt: true,
            },
          },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  const rows = registrations.flatMap((registration) =>
    registration.event.rounds.map((round) => ({
      registrationId: registration.id,
      eventTitle: `${registration.event.title} (${registration.event.year})`,
      round,
    })),
  );

  const submissions = rows.length
    ? await db.submission.findMany({
        where: {
          registrationId: { in: rows.map((r) => r.registrationId) },
          roundId: { in: rows.map((r) => r.round.id) },
        },
        select: {
          id: true,
          registrationId: true,
          roundId: true,
          originalName: true,
          sizeBytes: true,
          updatedAt: true,
          notes: true,
        },
      })
    : [];

  const byKey = new Map(
    submissions.map((s) => [`${s.registrationId}:${s.roundId}`, s]),
  );

  const extensions = ALLOWED_SUBMISSION_EXTENSIONS.join(", ");
  const maxSize = formatBytes(MAX_SUBMISSION_BYTES);

  return (
    <>
      <h1 className="text-2xl font-bold text-slate-900">My submissions</h1>
      <p className="mt-1 text-sm text-slate-600">
        Hand in your work for rounds that collect files.
      </p>

      {rows.length === 0 ? (
        <p className="mt-6 rounded-xl bg-white p-5 text-sm text-slate-500 shadow-sm ring-1 ring-slate-100">
          None of the rounds you are approved for collect submissions. If you are
          expecting to upload something, check with the organisers.
        </p>
      ) : (
        <ul className="mt-6 space-y-4">
          {rows.map(({ registrationId, eventTitle, round }) => {
            const window = submissionWindow(round);
            const closed = submissionClosedMessage(window);
            const existing = byKey.get(`${registrationId}:${round.id}`);

            return (
              <li
                key={`${registrationId}:${round.id}`}
                className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-slate-100"
              >
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <div>
                    <p className="text-sm font-bold text-slate-900">{round.name}</p>
                    <p className="text-xs text-slate-500">{eventTitle}</p>
                  </div>
                  {window.state === "open" && window.closesAt && (
                    <p className="text-xs font-semibold text-amber-700">
                      Closes {window.closesAt.toLocaleString("en-GB")}
                    </p>
                  )}
                </div>

                {closed ? (
                  <>
                    <p className="mt-3 rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-600">
                      {closed}
                    </p>
                    {existing && (
                      <p className="mt-2 text-xs text-slate-600">
                        Submitted:{" "}
                        <a
                          href={`/api/submissions/${existing.id}`}
                          className="font-medium text-bdaio-blue hover:underline"
                        >
                          {existing.originalName}
                        </a>{" "}
                        · {formatBytes(existing.sizeBytes)}
                      </p>
                    )}
                  </>
                ) : (
                  <SubmitForm
                    roundId={round.id}
                    extensions={extensions}
                    maxSize={maxSize}
                    existing={
                      existing
                        ? {
                            id: existing.id,
                            originalName: existing.originalName,
                            size: formatBytes(existing.sizeBytes),
                            updatedAt: existing.updatedAt.toLocaleString("en-GB"),
                            notes: existing.notes,
                          }
                        : null
                    }
                  />
                )}
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}
