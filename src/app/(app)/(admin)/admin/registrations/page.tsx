import type { Metadata } from "next";
import Link from "next/link";
import { db } from "@/lib/db";
import { decideRegistration } from "@/server/admin/actions";
import {
  ACTION_CLASS,
  DataTable,
  EmptyRow,
  RowActions,
  SortableTh,
  TBody,
  THead,
  Td,
  Th,
  Tr,
} from "@/components/admin/DataTable";
import { readSort, sortHref } from "@/lib/admin/sort";
import type { Prisma } from "@/generated/prisma/client";
import type { RegistrationStatus } from "@/generated/prisma/enums";

import { readPagination } from "@/lib/admin/pagination";
import { Pagination } from "@/components/admin/Pagination";

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

/** What may be sorted on, and the ordering each one means. */
const SORTS = {
  participant: (dir) => [{ user: { profile: { fullName: dir } } }],
  event: (dir) => [{ event: { title: dir } }, { createdAt: "desc" }],
  status: (dir) => [{ status: dir }, { createdAt: "desc" }],
  applied: (dir) => [{ createdAt: dir }],
} satisfies Record<
  string,
  (dir: "asc" | "desc") => Prisma.RegistrationOrderByWithRelationInput[]
>;

type SortKey = keyof typeof SORTS;
const SORT_KEYS = Object.keys(SORTS) as SortKey[];

export default async function AdminRegistrationsPage(
  props: PageProps<"/admin/registrations">,
) {
  const params = await props.searchParams;
  const status = typeof params.status === "string" ? params.status : "";
  const eventId = typeof params.eventId === "string" ? params.eventId : "";
  const sort = readSort(params, SORT_KEYS, { key: "applied", dir: "desc" });
  const { page, pageSize, skip, take } = readPagination(params, 20);

  const where: Prisma.RegistrationWhereInput = {
    ...(STATUSES.includes(status as RegistrationStatus)
      ? { status: status as RegistrationStatus }
      : {}),
    ...(eventId ? { eventId } : {}),
  };

  const [totalRegistrations, registrations, events, counts] = await Promise.all([
    db.registration.count({ where }),
    db.registration.findMany({
      where,
      orderBy: SORTS[sort.key](sort.dir),
      skip,
      take,
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

  const href = (column: SortKey) =>
    sortHref("/admin/registrations", params, sort, column);

  /**
   * A status filter link. It carries the sort through, or changing the filter
   * would silently reorder the table underneath you.
   */
  const filterHref = (next: string) => {
    const query = new URLSearchParams();
    if (next) query.set("status", next);
    if (eventId) query.set("eventId", eventId);
    query.set("sort", sort.key);
    query.set("dir", sort.dir);
    return `/admin/registrations?${query.toString()}`;
  };

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
          href={filterHref("")}
          className={`rounded-lg px-3 py-1.5 text-xs font-semibold ${!status ? "bg-bdaio-blue text-white" : "bg-white text-slate-600 ring-1 ring-slate-200"}`}
        >
          All
        </Link>
        {STATUSES.map((s) => (
          <Link
            key={s}
            href={filterHref(s)}
            className={`rounded-lg px-3 py-1.5 text-xs font-semibold ${status === s ? "bg-bdaio-blue text-white" : "bg-white text-slate-600 ring-1 ring-slate-200"}`}
          >
            {s.charAt(0) + s.slice(1).toLowerCase()} ({countFor(s)})
          </Link>
        ))}
      </div>

      <form method="get" className="mt-3">
        {status && <input type="hidden" name="status" value={status} />}
        {/* Same reason as the filter links: keep the column you sorted by. */}
        <input type="hidden" name="sort" value={sort.key} />
        <input type="hidden" name="dir" value={sort.dir} />
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

      <div className="mt-5">
        <DataTable minWidth={880}>
          <THead>
            <SortableTh column="participant" current={sort} href={href("participant")}>
              Participant
            </SortableTh>
            <SortableTh column="event" current={sort} href={href("event")}>
              Event
            </SortableTh>
            <SortableTh column="status" current={sort} href={href("status")}>
              Status
            </SortableTh>
            <SortableTh column="applied" current={sort} href={href("applied")}>
              Applied
            </SortableTh>
            <Th align="right" srOnly="Actions" />
          </THead>

          <TBody>
            {registrations.length === 0 && (
              <EmptyRow colSpan={5}>No registrations match this filter.</EmptyRow>
            )}

            {registrations.map((r) => (
              <Tr key={r.id}>
                <Td>
                  <p className="font-medium text-slate-900">
                    {r.user.profile?.fullName ?? "—"}
                  </p>
                  <p className="text-xs text-slate-500">{r.user.email}</p>
                </Td>

                <Td>
                  <p className="text-slate-800">{r.event.title}</p>
                  {r.round && <p className="text-xs text-slate-500">{r.round.name}</p>}
                </Td>

                <Td>
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${STATUS_STYLES[r.status]}`}
                  >
                    {r.status.charAt(0) + r.status.slice(1).toLowerCase()}
                  </span>
                </Td>

                <Td>
                  <span className="whitespace-nowrap text-xs text-slate-500">
                    {r.createdAt.toLocaleDateString("en-GB", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                    })}
                  </span>
                </Td>

                <RowActions>
                  {r.status !== "APPROVED" && r.status !== "WITHDRAWN" && (
                    <form action={decideRegistration}>
                      <input type="hidden" name="registrationId" value={r.id} />
                      <input type="hidden" name="decision" value="APPROVED" />
                      <button type="submit" className={ACTION_CLASS.good}>
                        Approve
                      </button>
                    </form>
                  )}
                  {r.status !== "REJECTED" && r.status !== "WITHDRAWN" && (
                    <form action={decideRegistration}>
                      <input type="hidden" name="registrationId" value={r.id} />
                      <input type="hidden" name="decision" value="REJECTED" />
                      <button type="submit" className={ACTION_CLASS.danger}>
                        Reject
                      </button>
                    </form>
                  )}
                </RowActions>
              </Tr>
            ))}
          </TBody>
        </DataTable>
        <Pagination
          page={page}
          pageSize={pageSize}
          totalItems={totalRegistrations}
          basePath="/admin/registrations"
          searchParams={params}
        />
      </div>
    </>
  );
}
