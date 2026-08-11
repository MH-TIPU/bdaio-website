import type { Metadata } from "next";
import { db } from "@/lib/db";
import {
  DataTable,
  EmptyRow,
  SortableTh,
  TBody,
  THead,
  Td,
  Tr,
} from "@/components/admin/DataTable";
import { readSort, sortHref } from "@/lib/admin/sort";
import type { Prisma } from "@/generated/prisma/client";

export const metadata: Metadata = { title: "Audit log · Admin" };

/** What may be sorted on, and the ordering each one means. */
const SORTS = {
  when: (dir) => [{ createdAt: dir }],
  action: (dir) => [{ action: dir }, { createdAt: "desc" }],
  by: (dir) => [{ user: { email: dir } }, { createdAt: "desc" }],
  entity: (dir) => [{ entityType: dir }, { createdAt: "desc" }],
} satisfies Record<
  string,
  (dir: "asc" | "desc") => Prisma.ActivityLogOrderByWithRelationInput[]
>;

type SortKey = keyof typeof SORTS;
const SORT_KEYS = Object.keys(SORTS) as SortKey[];

/**
 * The audit trail. Every trust decision (verification, role change, publish,
 * suspension) is written here, and rejected attempts write nothing — so this
 * never implies an action that did not happen.
 */
export default async function AdminLogsPage(props: PageProps<"/admin/logs">) {
  const params = await props.searchParams;
  const filter = typeof params.action === "string" ? params.action.trim() : "";
  const sort = readSort(params, SORT_KEYS, { key: "when", dir: "desc" });

  const [entries, actions] = await Promise.all([
    db.activityLog.findMany({
      where: filter ? { action: { startsWith: filter } } : {},
      orderBy: SORTS[sort.key](sort.dir),
      take: 200,
      include: { user: { select: { email: true } } },
    }),
    db.activityLog.groupBy({ by: ["action"], _count: true, orderBy: { action: "asc" } }),
  ]);

  const href = (column: SortKey) => sortHref("/admin/logs", params, sort, column);

  /** An action chip. Carries the sort, so filtering never reorders the table. */
  const filterHref = (action: string) =>
    `/admin/logs?action=${encodeURIComponent(action)}&sort=${sort.key}&dir=${sort.dir}`;

  return (
    <>
      <h1 className="text-2xl font-bold text-slate-900">Audit log</h1>
      <p className="mt-1 text-sm text-slate-600">
        The first 200 entries in the order shown. Rejected attempts are not logged.
      </p>

      <form method="get" className="mt-4 flex flex-wrap gap-2">
        <input
          name="action"
          defaultValue={filter}
          placeholder="Filter by action prefix, e.g. admin."
          className="w-full max-w-sm rounded-lg border border-slate-200 px-3 py-2.5 text-sm focus:border-bdaio-blue focus:outline-none focus:ring-2 focus:ring-bdaio-blue/30"
        />
        {/* Carried through the filter, or filtering would silently reset the
            column you had sorted by. */}
        <input type="hidden" name="sort" value={sort.key} />
        <input type="hidden" name="dir" value={sort.dir} />
        <button
          type="submit"
          className="rounded-lg bg-white px-4 py-2.5 text-sm font-semibold text-bdaio-blue ring-1 ring-slate-200 hover:bg-slate-50"
        >
          Filter
        </button>
      </form>

      <div className="mt-4 flex flex-wrap gap-1.5">
        {actions.slice(0, 24).map((a) => (
          <a
            key={a.action}
            href={filterHref(a.action)}
            className="rounded-full bg-white px-2.5 py-1 font-mono text-xs text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50"
          >
            {a.action} · {a._count}
          </a>
        ))}
      </div>

      <div className="mt-6">
        <DataTable minWidth={640}>
          <THead>
            <SortableTh column="when" current={sort} href={href("when")}>
              When
            </SortableTh>
            <SortableTh column="action" current={sort} href={href("action")}>
              Action
            </SortableTh>
            <SortableTh column="by" current={sort} href={href("by")}>
              By
            </SortableTh>
            <SortableTh column="entity" current={sort} href={href("entity")}>
              Entity
            </SortableTh>
          </THead>

          <TBody>
            {entries.length === 0 && (
              <EmptyRow colSpan={4}>
                Nothing logged{filter ? ` for “${filter}”` : ""} yet.
              </EmptyRow>
            )}

            {entries.map((entry) => (
              <Tr key={entry.id}>
                <Td className="whitespace-nowrap text-xs text-slate-500">
                  {entry.createdAt.toLocaleString("en-GB")}
                </Td>
                <Td className="font-mono text-xs text-slate-800">{entry.action}</Td>
                <Td className="text-xs text-slate-600">{entry.user?.email ?? "system"}</Td>
                <Td className="text-xs text-slate-500">{entry.entityType ?? "—"}</Td>
              </Tr>
            ))}
          </TBody>
        </DataTable>
      </div>
    </>
  );
}
