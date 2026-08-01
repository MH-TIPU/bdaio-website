import type { Metadata } from "next";
import Link from "next/link";
import { db } from "@/lib/db";
import { decideRegistration } from "@/server/admin/actions";
import type { RegistrationStatus } from "@/generated/prisma/enums";

export const metadata: Metadata = { title: "Registrations · Admin" };

const STATUSES: RegistrationStatus[] = [
  "APPLIED",
  "APPROVED",
  "WAITLISTED",
  "REJECTED",
  "WITHDRAWN",
];

const STATUS_STYLES: Record<RegistrationStatus, string> = {
  APPLIED: "bg-blue-50 text-blue-700",
  APPROVED: "bg-emerald-50 text-emerald-700",
  WAITLISTED: "bg-amber-50 text-amber-800",
  REJECTED: "bg-red-50 text-red-700",
  WITHDRAWN: "bg-slate-100 text-slate-600",
};

export default async function AdminRegistrationsPage(
  props: PageProps<"/admin/registrations">,
) {
  const params = await props.searchParams;
  const status = typeof params.status === "string" ? params.status : "";
  const eventId = typeof params.eventId === "string" ? params.eventId : "";

  const where = {
    ...(STATUSES.includes(status as RegistrationStatus)
      ? { status: status as RegistrationStatus }
      : {}),
    ...(eventId ? { eventId } : {}),
  };

  const [registrations, events, counts] = await Promise.all([
    db.registration.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: 200,
      include: {
        user: { select: { email: true, profile: { select: { fullName: true } } } },
        event: { select: { id: true, title: true } },
        round: { select: { name: true } },
      },
    }),
    db.event.findMany({
      orderBy: [{ year: "desc" }, { title: "asc" }],
      select: { id: true, title: true },
    }),
    db.registration.groupBy({ by: ["status"], _count: true }),
  ]);

  const countFor = (s: RegistrationStatus) =>
    counts.find((c) => c.status === s)?._count ?? 0;

  const exportQuery = new URLSearchParams();
  if (status) exportQuery.set("status", status);
  if (eventId) exportQuery.set("eventId", eventId);

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Registrations</h1>
          <p className="mt-1 text-sm text-slate-600">
            Review entries, confirm places, and export lists.
          </p>
        </div>
        <a
          href={`/admin/registrations/export?${exportQuery.toString()}`}
          className="rounded-lg bg-white px-4 py-2.5 text-sm font-semibold text-bdaio-blue ring-1 ring-slate-200 transition-colors hover:bg-slate-50"
        >
          Export CSV
        </a>
      </div>

      {/* Filters are plain links so the view is shareable and bookmarkable. */}
      <div className="mt-5 flex flex-wrap gap-2">
        <Link
          href="/admin/registrations"
          className={`rounded-lg px-3 py-1.5 text-xs font-semibold ${!status ? "bg-bdaio-blue text-white" : "bg-white text-slate-600 ring-1 ring-slate-200"}`}
        >
          All
        </Link>
        {STATUSES.map((s) => (
          <Link
            key={s}
            href={`/admin/registrations?status=${s}`}
            className={`rounded-lg px-3 py-1.5 text-xs font-semibold ${status === s ? "bg-bdaio-blue text-white" : "bg-white text-slate-600 ring-1 ring-slate-200"}`}
          >
            {s.charAt(0) + s.slice(1).toLowerCase()} ({countFor(s)})
          </Link>
        ))}
      </div>

      <form method="get" className="mt-3">
        {status && <input type="hidden" name="status" value={status} />}
        <select
          name="eventId"
          defaultValue={eventId}
          className="rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900"
        >
          <option value="">All events</option>
          {events.map((e) => (
            <option key={e.id} value={e.id}>
              {e.title}
            </option>
          ))}
        </select>
        <button
          type="submit"
          className="ml-2 rounded-lg bg-white px-3 py-2 text-sm font-semibold text-bdaio-blue ring-1 ring-slate-200"
        >
          Filter
        </button>
      </form>

      <div className="mt-5 overflow-x-auto rounded-xl bg-white shadow-sm ring-1 ring-slate-100">
        <table className="w-full min-w-[760px] text-left text-sm">
          <thead className="border-b border-slate-100 bg-slate-50/70">
            <tr>
              <th className="px-4 py-3 font-semibold text-slate-700">Participant</th>
              <th className="px-4 py-3 font-semibold text-slate-700">Event</th>
              <th className="px-4 py-3 font-semibold text-slate-700">Status</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {registrations.map((r) => (
              <tr key={r.id}>
                <td className="px-4 py-3">
                  <p className="font-medium text-slate-900">
                    {r.user.profile?.fullName ?? "—"}
                  </p>
                  <p className="text-xs text-slate-500">{r.user.email}</p>
                </td>
                <td className="px-4 py-3">
                  <p className="text-slate-800">{r.event.title}</p>
                  {r.round && (
                    <p className="text-xs text-slate-500">{r.round.name}</p>
                  )}
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${STATUS_STYLES[r.status]}`}
                  >
                    {r.status.charAt(0) + r.status.slice(1).toLowerCase()}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex justify-end gap-2 whitespace-nowrap">
                    {r.status !== "APPROVED" && r.status !== "WITHDRAWN" && (
                      <form action={decideRegistration}>
                        <input type="hidden" name="registrationId" value={r.id} />
                        <input type="hidden" name="decision" value="APPROVED" />
                        <button
                          type="submit"
                          className="rounded-lg px-2.5 py-1 text-xs font-semibold text-emerald-700 ring-1 ring-emerald-200 hover:bg-emerald-50"
                        >
                          Approve
                        </button>
                      </form>
                    )}
                    {r.status !== "REJECTED" && r.status !== "WITHDRAWN" && (
                      <form action={decideRegistration}>
                        <input type="hidden" name="registrationId" value={r.id} />
                        <input type="hidden" name="decision" value="REJECTED" />
                        <button
                          type="submit"
                          className="rounded-lg px-2.5 py-1 text-xs font-semibold text-red-600 ring-1 ring-red-200 hover:bg-red-50"
                        >
                          Reject
                        </button>
                      </form>
                    )}
                  </div>
                </td>
              </tr>
            ))}
            {registrations.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-slate-500">
                  No registrations match this filter.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {registrations.length === 200 && (
        <p className="mt-3 text-xs text-slate-500">
          Showing the 200 most recent entries — narrow the filter or export to CSV
          for the full list.
        </p>
      )}
    </>
  );
}
