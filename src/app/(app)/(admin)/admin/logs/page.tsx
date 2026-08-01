import type { Metadata } from "next";
import { db } from "@/lib/db";

export const metadata: Metadata = { title: "Audit log · Admin" };

/**
 * The audit trail. Every trust decision (verification, role change, publish,
 * suspension) is written here, and rejected attempts write nothing — so this
 * never implies an action that did not happen.
 */
export default async function AdminLogsPage(props: PageProps<"/admin/logs">) {
  const { action } = await props.searchParams;
  const filter = typeof action === "string" ? action.trim() : "";

  const [entries, actions] = await Promise.all([
    db.activityLog.findMany({
      where: filter ? { action: { startsWith: filter } } : {},
      orderBy: { createdAt: "desc" },
      take: 200,
      include: { user: { select: { email: true } } },
    }),
    db.activityLog.groupBy({ by: ["action"], _count: true, orderBy: { action: "asc" } }),
  ]);

  return (
    <>
      <h1 className="text-2xl font-bold text-slate-900">Audit log</h1>
      <p className="mt-1 text-sm text-slate-600">
        The 200 most recent actions. Rejected attempts are not logged.
      </p>

      <form method="get" className="mt-4 flex flex-wrap gap-2">
        <input
          name="action"
          defaultValue={filter}
          placeholder="Filter by action prefix, e.g. admin."
          className="w-full max-w-sm rounded-lg border border-slate-200 px-3 py-2.5 text-sm focus:border-bdaio-blue focus:outline-none focus:ring-2 focus:ring-bdaio-blue/30"
        />
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
            href={`/admin/logs?action=${encodeURIComponent(a.action)}`}
            className="rounded-full bg-white px-2.5 py-1 font-mono text-xs text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50"
          >
            {a.action} · {a._count}
          </a>
        ))}
      </div>

      <div className="mt-6 overflow-x-auto rounded-xl bg-white shadow-sm ring-1 ring-slate-100">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead className="border-b border-slate-100 bg-slate-50/70">
            <tr>
              <th className="px-4 py-3 font-semibold text-slate-700">When</th>
              <th className="px-4 py-3 font-semibold text-slate-700">Action</th>
              <th className="px-4 py-3 font-semibold text-slate-700">By</th>
              <th className="px-4 py-3 font-semibold text-slate-700">Entity</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {entries.map((entry) => (
              <tr key={entry.id}>
                <td className="whitespace-nowrap px-4 py-2.5 text-xs text-slate-500">
                  {entry.createdAt.toLocaleString("en-GB")}
                </td>
                <td className="px-4 py-2.5 font-mono text-xs text-slate-800">
                  {entry.action}
                </td>
                <td className="px-4 py-2.5 text-xs text-slate-600">
                  {entry.user?.email ?? "system"}
                </td>
                <td className="px-4 py-2.5 text-xs text-slate-500">
                  {entry.entityType ?? "—"}
                </td>
              </tr>
            ))}
            {entries.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-slate-500">
                  Nothing logged{filter ? ` for "${filter}"` : ""} yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}
