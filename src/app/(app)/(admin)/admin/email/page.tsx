import type { Metadata } from "next";
import { db } from "@/lib/db";
import { MAX_ATTEMPTS } from "@/lib/email/queue";
import { retryEmail } from "@/server/admin/email";
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

export const metadata: Metadata = { title: "Email queue · Admin" };

/** Always fresh: a queue you are watching drain is the one thing that must not be cached. */
export const dynamic = "force-dynamic";

const STATUS_STYLE = {
  PENDING: "bg-amber-50 text-amber-800 ring-amber-200",
  SENDING: "bg-blue-50 text-blue-800 ring-blue-200",
  SENT: "bg-emerald-50 text-emerald-800 ring-emerald-200",
  FAILED: "bg-red-50 text-red-800 ring-red-200",
} as const;

/**
 * What may be sorted on, and the ordering each one means.
 *
 * Tries descending is the one worth reaching for: it floats whatever has been
 * retried most, which is the job about to exhaust its attempts.
 */
const SORTS = {
  status: (dir) => [{ status: dir }, { createdAt: "desc" }],
  to: (dir) => [{ to: dir }, { createdAt: "desc" }],
  subject: (dir) => [{ subject: dir }, { createdAt: "desc" }],
  queued: (dir) => [{ createdAt: dir }],
  tries: (dir) => [{ attempts: dir }, { createdAt: "desc" }],
} satisfies Record<
  string,
  (dir: "asc" | "desc") => Prisma.EmailJobOrderByWithRelationInput[]
>;

type SortKey = keyof typeof SORTS;
const SORT_KEYS = Object.keys(SORTS) as SortKey[];

function when(date: Date): string {
  return date.toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default async function AdminEmailPage(props: PageProps<"/admin/email">) {
  const params = await props.searchParams;
  const sort = readSort(params, SORT_KEYS, { key: "queued", dir: "desc" });

  const [jobs, counts] = await Promise.all([
    db.emailJob.findMany({ orderBy: SORTS[sort.key](sort.dir), take: 100 }),
    db.emailJob.groupBy({ by: ["status"], _count: { _all: true } }),
  ]);

  const byStatus = new Map(counts.map((row) => [row.status, row._count._all]));
  const href = (column: SortKey) => sortHref("/admin/email", params, sort, column);

  return (
    <>
      <h1 className="text-2xl font-bold text-slate-900">Email queue</h1>
      <p className="mt-1 text-sm text-slate-600">
        Every transactional email, queued and sent after the response rather than during it. A
        failed send is retried {MAX_ATTEMPTS - 1} times with a growing delay before it lands
        here for a human.
      </p>

      <div className="mt-6 flex flex-wrap gap-3">
        {(["PENDING", "SENDING", "SENT", "FAILED"] as const).map((status) => (
          <div
            key={status}
            className="rounded-xl bg-white px-4 py-3 shadow-sm ring-1 ring-slate-100"
          >
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
              {status.toLowerCase()}
            </p>
            <p className="text-xl font-bold text-slate-900">{byStatus.get(status) ?? 0}</p>
          </div>
        ))}
      </div>

      <h2 className="mt-8 text-sm font-semibold text-slate-900">First 100 in this order</h2>

      <div className="mt-3">
        <DataTable minWidth={960}>
          <THead>
            <SortableTh column="status" current={sort} href={href("status")}>
              Status
            </SortableTh>
            <SortableTh column="to" current={sort} href={href("to")}>
              To
            </SortableTh>
            <SortableTh column="subject" current={sort} href={href("subject")}>
              Subject
            </SortableTh>
            <SortableTh column="queued" current={sort} href={href("queued")}>
              Queued
            </SortableTh>
            <SortableTh column="tries" current={sort} href={href("tries")}>
              Tries
            </SortableTh>
            <Th>Last error</Th>
            <Th align="right" srOnly="Actions" />
          </THead>

          <TBody>
            {jobs.length === 0 && (
              <EmptyRow colSpan={7}>Nothing has been queued yet.</EmptyRow>
            )}

            {jobs.map((job) => (
              <Tr key={job.id}>
                <Td>
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-semibold ring-1 ${
                      STATUS_STYLE[job.status]
                    }`}
                  >
                    {job.status.toLowerCase()}
                  </span>
                </Td>

                <Td className="text-slate-700">{job.to}</Td>
                <Td className="text-slate-700">{job.subject}</Td>

                <Td className="whitespace-nowrap text-slate-500">{when(job.createdAt)}</Td>
                <Td className="text-slate-500">{job.attempts}</Td>

                <Td className="max-w-xs text-xs text-slate-500">{job.lastError ?? "—"}</Td>

                <RowActions>
                  {job.status === "FAILED" && (
                    <form action={retryEmail}>
                      <input type="hidden" name="id" value={job.id} />
                      <button type="submit" className={ACTION_CLASS.normal}>
                        Retry
                      </button>
                    </form>
                  )}
                </RowActions>
              </Tr>
            ))}
          </TBody>
        </DataTable>
      </div>
    </>
  );
}
