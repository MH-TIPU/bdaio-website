import type { Metadata } from "next";
import { db } from "@/lib/db";
import { decideCommunityRole } from "@/server/community/actions";

export const metadata: Metadata = { title: "Community roles · Admin" };

const STATUS_STYLES = {
  PENDING: "bg-amber-50 text-amber-800",
  APPROVED: "bg-emerald-50 text-emerald-700",
  REJECTED: "bg-red-50 text-red-700",
} as const;

export default async function AdminCommunityPage() {
  // Admins decide BdAIO-wide roles; institution-scoped ones go to moderators.
  const applications = await db.communityRole.findMany({
    where: { institutionId: null },
    orderBy: [{ status: "asc" }, { createdAt: "desc" }],
    include: {
      user: {
        select: {
          email: true,
          profile: { select: { fullName: true, handle: true } },
        },
      },
    },
  });

  const pending = applications.filter((a) => a.status === "PENDING");

  return (
    <>
      <h1 className="text-2xl font-bold text-slate-900">Community roles</h1>
      <p className="mt-1 text-sm text-slate-600">
        BdAIO-wide volunteer, mentor, and contributor applications. Approving one
        grants the matching public badge.
      </p>

      {pending.length > 0 && (
        <p className="mt-4 rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-800">
          {pending.length} awaiting review.
        </p>
      )}

      <div className="mt-6 space-y-4">
        {applications.map((app) => (
          <div
            key={app.id}
            className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-slate-100"
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-sm font-semibold text-slate-900">
                    {app.user.profile?.fullName ?? app.user.email}
                  </p>
                  <span className="rounded-full bg-bdaio-blue/10 px-2.5 py-0.5 text-xs font-semibold text-bdaio-blue">
                    {app.type.charAt(0) + app.type.slice(1).toLowerCase()}
                  </span>
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${STATUS_STYLES[app.status]}`}
                  >
                    {app.status.charAt(0) + app.status.slice(1).toLowerCase()}
                  </span>
                </div>
                <p className="text-xs text-slate-500">{app.user.email}</p>
                {app.motivation && (
                  <p className="mt-2 text-sm text-slate-700">{app.motivation}</p>
                )}
              </div>

              {app.status === "PENDING" && (
                <div className="flex gap-2">
                  <form action={decideCommunityRole}>
                    <input type="hidden" name="roleId" value={app.id} />
                    <input type="hidden" name="decision" value="APPROVED" />
                    <button
                      type="submit"
                      className="rounded-lg px-2.5 py-1 text-xs font-semibold text-emerald-700 ring-1 ring-emerald-200 hover:bg-emerald-50"
                    >
                      Approve
                    </button>
                  </form>
                  <form action={decideCommunityRole}>
                    <input type="hidden" name="roleId" value={app.id} />
                    <input type="hidden" name="decision" value="REJECTED" />
                    <button
                      type="submit"
                      className="rounded-lg px-2.5 py-1 text-xs font-semibold text-red-600 ring-1 ring-red-200 hover:bg-red-50"
                    >
                      Reject
                    </button>
                  </form>
                </div>
              )}
            </div>
          </div>
        ))}

        {applications.length === 0 && (
          <p className="rounded-xl bg-white px-4 py-8 text-center text-sm text-slate-500 shadow-sm ring-1 ring-slate-100">
            No BdAIO-wide applications yet.
          </p>
        )}
      </div>
    </>
  );
}
