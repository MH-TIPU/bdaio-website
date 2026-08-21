import type { Metadata } from "next";
import Link from "next/link";
import { db } from "@/lib/db";
import { cloneEvent, deleteEvent } from "@/server/admin/actions";
import { TYPE_LABELS, StatusPill, formatDate } from "@/components/events/EventCard";
import { readPagination } from "@/lib/admin/pagination";
import { Pagination } from "@/components/admin/Pagination";

export const metadata: Metadata = { title: "Events · Admin" };

export default async function AdminEventsPage(props: PageProps<"/admin/events">) {
  const params = await props.searchParams;
  const { page, pageSize, skip, take } = readPagination(params, 15);

  const [totalEvents, events] = await Promise.all([
    db.event.count(),
    db.event.findMany({
      orderBy: [{ year: "desc" }, { startsAt: "asc" }],
      skip,
      take,
      include: {
        program: { select: { title: true } },
        _count: { select: { registrations: true, rounds: true } },
      },
    }),
  ]);

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Events</h1>
          <p className="mt-1 text-sm text-slate-600">
            Olympiad editions, regional rounds, workshops, and courses.
          </p>
        </div>
        <Link
          href="/admin/events/new"
          className="rounded-lg bg-bdaio-blue px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-bdaio-blue-dark"
        >
          New event
        </Link>
      </div>

      <div className="mt-6 overflow-x-auto rounded-xl bg-white shadow-sm ring-1 ring-slate-100">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead className="border-b border-slate-100 bg-slate-50/70">
            <tr>
              <th className="px-4 py-3 font-semibold text-slate-700">Event</th>
              <th className="px-4 py-3 font-semibold text-slate-700">Type</th>
              <th className="px-4 py-3 font-semibold text-slate-700">Status</th>
              <th className="px-4 py-3 font-semibold text-slate-700">Entries</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {events.map((event) => (
              <tr key={event.id}>
                <td className="px-4 py-3">
                  <p className="font-medium text-slate-900">{event.title}</p>
                  <p className="text-xs text-slate-500">
                    {event.program.title}
                    {event.startsAt ? ` · ${formatDate(event.startsAt)}` : ""}
                  </p>
                </td>
                <td className="px-4 py-3 text-slate-700">
                  {TYPE_LABELS[event.type]}
                  {event._count.rounds > 0 && (
                    <span className="ml-1 text-xs text-slate-500">
                      ({event._count.rounds} rounds)
                    </span>
                  )}
                </td>
                <td className="px-4 py-3">
                  <StatusPill status={event.status} />
                </td>
                <td className="px-4 py-3 text-slate-700">
                  {event._count.registrations}
                  {event.capacity !== null && (
                    <span className="text-xs text-slate-500"> / {event.capacity}</span>
                  )}
                </td>
                <td className="px-4 py-3">
                  <div className="flex justify-end gap-3 whitespace-nowrap">
                    <Link
                      href={`/admin/events/${event.id}/rounds`}
                      className="text-sm font-semibold text-slate-600 hover:underline"
                    >
                      Rounds
                    </Link>
                    <Link
                      href={`/admin/events/${event.id}`}
                      className="text-sm font-semibold text-bdaio-blue hover:underline"
                    >
                      Edit
                    </Link>
                    <form action={cloneEvent}>
                      <input type="hidden" name="id" value={event.id} />
                      <button
                        type="submit"
                        className="text-sm font-semibold text-slate-600 hover:underline"
                        title="Create next year's draft from this edition"
                      >
                        Clone
                      </button>
                    </form>
                    <form action={deleteEvent}>
                      <input type="hidden" name="id" value={event.id} />
                      <button
                        type="submit"
                        className="text-sm font-semibold text-red-600 hover:underline"
                        title="Delete event"
                      >
                        Delete
                      </button>
                    </form>
                  </div>
                </td>
              </tr>
            ))}
            {events.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-slate-500">
                  No events yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <Pagination
        page={page}
        pageSize={pageSize}
        totalItems={totalEvents}
        basePath="/admin/events"
        searchParams={params}
      />
    </>
  );
}
