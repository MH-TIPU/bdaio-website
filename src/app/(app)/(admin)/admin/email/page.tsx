import type { Metadata } from "next";
import { db } from "@/lib/db";
import { MAX_ATTEMPTS } from "@/lib/email/queue";
import { retryEmail } from "@/server/admin/email";

export const metadata: Metadata = { title: "Email queue · Admin" };

/** Always fresh: a queue you are watching drain is the one thing that must not be cached. */
export const dynamic = "force-dynamic";

const STATUS_STYLE = {
  PENDING: "bg-amber-50 text-amber-800 ring-amber-200",
  SENDING: "bg-blue-50 text-blue-800 ring-blue-200",
  SENT: "bg-emerald-50 text-emerald-800 ring-emerald-200",
  FAILED: "bg-red-50 text-red-800 ring-red-200",
} as const;

function when(date: Date): string {
  return date.toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default async function AdminEmailPage() {
  const [jobs, counts] = await Promise.all([
    db.emailJob.findMany({ orderBy: { createdAt: "desc" }, take: 100 }),
    db.emailJob.groupBy({ by: ["status"], _count: { _all: true } }),
  ]);

  const byStatus = new Map(counts.map((row) => [row.status, row._count._all]));

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

      <h2 className="mt-8 text-sm font-semibold text-slate-900">Most recent 100</h2>

      {jobs.length === 0 ? (
        <p className="mt-3 rounded-xl bg-white p-5 text-sm text-slate-500 shadow-sm ring-1 ring-slate-100">
          Nothing has been queued yet.
        </p>
      ) : (
        <div className="mt-3 overflow-x-auto rounded-xl bg-white shadow-sm ring-1 ring-slate-100">
          <table className="min-w-full text-sm">
            <thead className="border-b border-slate-100 text-left text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">To</th>
                <th className="px-4 py-3 font-medium">Subject</th>
                <th className="px-4 py-3 font-medium">Queued</th>
                <th className="px-4 py-3 font-medium">Tries</th>
                <th className="px-4 py-3 font-medium">Last error</th>
                <th className="px-4 py-3 font-medium" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {jobs.map((job) => (
                <tr key={job.id} className="align-top">
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-semibold ring-1 ${
                        STATUS_STYLE[job.status]
                      }`}
                    >
                      {job.status.toLowerCase()}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-700">{job.to}</td>
                  <td className="px-4 py-3 text-slate-700">{job.subject}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-slate-500">
                    {when(job.createdAt)}
                  </td>
                  <td className="px-4 py-3 text-slate-500">{job.attempts}</td>
                  <td className="max-w-xs px-4 py-3 text-xs text-slate-500">
                    {job.lastError ?? "—"}
                  </td>
                  <td className="px-4 py-3">
                    {job.status === "FAILED" && (
                      <form action={retryEmail}>
                        <input type="hidden" name="id" value={job.id} />
                        <button
                          type="submit"
                          className="rounded-lg px-2.5 py-1 text-xs font-semibold text-bdaio-blue ring-1 ring-slate-200 hover:bg-slate-50"
                        >
                          Retry
                        </button>
                      </form>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
