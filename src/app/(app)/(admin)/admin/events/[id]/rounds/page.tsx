import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { deleteRound } from "@/server/admin/actions";
import { RoundForm } from "@/components/admin/RoundForm";
import { MODE_LABELS, formatDate } from "@/components/events/EventCard";
import { hasRounds } from "@/lib/events/registration";

export const metadata: Metadata = { title: "Rounds · Admin" };

function toLocalInput(value: Date | null): string {
  if (!value) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${value.getFullYear()}-${pad(value.getMonth() + 1)}-${pad(value.getDate())}T${pad(value.getHours())}:${pad(value.getMinutes())}`;
}

export default async function EventRoundsPage(
  props: PageProps<"/admin/events/[id]/rounds">,
) {
  const { id } = await props.params;

  const event = await db.event.findUnique({
    where: { id },
    include: {
      rounds: {
        orderBy: { order: "asc" },
        include: { _count: { select: { registrations: true } } },
      },
    },
  });
  if (!event) notFound();

  return (
    <>
      <Link
        href={`/admin/events/${event.id}`}
        className="text-sm font-medium text-bdaio-blue hover:underline"
      >
        ← {event.title}
      </Link>
      <h1 className="mt-3 text-2xl font-bold text-slate-900">Rounds</h1>
      <p className="mt-1 text-sm text-slate-600">
        Stages within this event, in the order participants progress through them.
      </p>

      {!hasRounds(event.type) && (
        <p className="mt-4 rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-800">
          This event is a {event.type.toLowerCase().replace("_", " ")}, which
          normally runs as a single session rather than in rounds. You can still
          add rounds if you need them.
        </p>
      )}

      <div className="mt-6 space-y-4">
        {event.rounds.map((round) => (
          <div
            key={round.id}
            className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-slate-100"
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="font-semibold text-slate-900">
                  {round.order}. {round.name}
                </p>
                <p className="mt-0.5 text-xs text-slate-500">
                  {MODE_LABELS[round.mode]}
                  {round.venue ? ` · ${round.venue}` : ""}
                  {round.startsAt ? ` · ${formatDate(round.startsAt)}` : ""}
                  {` · ${round._count.registrations} entries`}
                </p>
              </div>
              {round._count.registrations === 0 ? (
                <form action={deleteRound}>
                  <input type="hidden" name="id" value={round.id} />
                  <button
                    type="submit"
                    className="rounded-lg px-3 py-1.5 text-xs font-semibold text-red-600 ring-1 ring-red-200 transition-colors hover:bg-red-50"
                  >
                    Delete
                  </button>
                </form>
              ) : (
                <span
                  className="text-xs text-slate-400"
                  title="Rounds with entries cannot be deleted"
                >
                  Has entries
                </span>
              )}
            </div>

            <details className="mt-4">
              <summary className="cursor-pointer text-sm font-medium text-bdaio-blue">
                Edit
              </summary>
              <div className="mt-3 border-t border-slate-100 pt-3">
                <RoundForm
                  eventId={event.id}
                  compact
                  defaults={{
                    id: round.id,
                    name: round.name,
                    order: String(round.order),
                    mode: round.mode,
                    venue: round.venue ?? "",
                    startsAt: toLocalInput(round.startsAt),
                    allowSubmissions: round.allowSubmissions,
                    submissionsOpenAt: toLocalInput(round.submissionsOpenAt),
                    submissionsCloseAt: toLocalInput(round.submissionsCloseAt),
                  }}
                />
              </div>
            </details>
          </div>
        ))}

        <div className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-slate-100">
          <h2 className="text-sm font-semibold text-slate-900">Add a round</h2>
          <div className="mt-3">
            <RoundForm
              eventId={event.id}
              defaults={{
                name: "",
                order: String(event.rounds.length + 1),
                mode: event.mode,
                venue: "",
                startsAt: "",
                allowSubmissions: false,
                submissionsOpenAt: "",
                submissionsCloseAt: "",
              }}
            />
          </div>
        </div>
      </div>
    </>
  );
}
