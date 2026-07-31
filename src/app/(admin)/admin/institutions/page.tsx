import type { Metadata } from "next";
import Link from "next/link";
import { db } from "@/lib/db";
import { decideInstitution } from "@/server/community/actions";

export const metadata: Metadata = { title: "Institutions · Admin" };

const STATUS_STYLES = {
  PENDING: "bg-amber-50 text-amber-800",
  APPROVED: "bg-emerald-50 text-emerald-700",
  SUSPENDED: "bg-red-50 text-red-700",
} as const;

export default async function AdminInstitutionsPage() {
  const institutions = await db.institution.findMany({
    orderBy: [{ status: "asc" }, { createdAt: "desc" }],
    include: {
      _count: { select: { memberships: true } },
      memberships: {
        where: { membershipRole: "MODERATOR" },
        include: {
          user: { select: { email: true, profile: { select: { fullName: true } } } },
        },
      },
    },
  });

  const pending = institutions.filter((i) => i.status === "PENDING");

  return (
    <>
      <h1 className="text-2xl font-bold text-slate-900">Institutions</h1>
      <p className="mt-1 text-sm text-slate-600">
        Approving an institution makes it public, marks it verified, and installs
        its moderators — who can then verify their own students.
      </p>

      {pending.length > 0 && (
        <p className="mt-4 rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-800">
          {pending.length} awaiting review.
        </p>
      )}

      <div className="mt-6 overflow-x-auto rounded-xl bg-white shadow-sm ring-1 ring-slate-100">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead className="border-b border-slate-100 bg-slate-50/70">
            <tr>
              <th className="px-4 py-3 font-semibold text-slate-700">Institution</th>
              <th className="px-4 py-3 font-semibold text-slate-700">Proposed by</th>
              <th className="px-4 py-3 font-semibold text-slate-700">Status</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {institutions.map((institution) => (
              <tr key={institution.id}>
                <td className="px-4 py-3">
                  <p className="font-medium text-slate-900">{institution.name}</p>
                  <p className="text-xs text-slate-500">
                    {institution.type.charAt(0) + institution.type.slice(1).toLowerCase()}
                    {institution.district ? ` · ${institution.district}` : ""} ·{" "}
                    {institution._count.memberships} members
                  </p>
                  {institution.status === "APPROVED" && (
                    <Link
                      href={`/institutions/${institution.slug}`}
                      className="text-xs font-semibold text-bdaio-blue hover:underline"
                    >
                      View public page
                    </Link>
                  )}
                </td>
                <td className="px-4 py-3">
                  {institution.memberships.map((m) => (
                    <p key={m.id} className="text-xs text-slate-600">
                      {m.user.profile?.fullName ?? m.user.email}
                    </p>
                  ))}
                  {institution.memberships.length === 0 && (
                    <span className="text-xs text-slate-400">—</span>
                  )}
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${STATUS_STYLES[institution.status]}`}
                  >
                    {institution.status.charAt(0) +
                      institution.status.slice(1).toLowerCase()}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex justify-end gap-2 whitespace-nowrap">
                    {institution.status !== "APPROVED" && (
                      <form action={decideInstitution}>
                        <input type="hidden" name="institutionId" value={institution.id} />
                        <input type="hidden" name="decision" value="APPROVED" />
                        <button
                          type="submit"
                          className="rounded-lg px-2.5 py-1 text-xs font-semibold text-emerald-700 ring-1 ring-emerald-200 hover:bg-emerald-50"
                        >
                          Approve
                        </button>
                      </form>
                    )}
                    {institution.status !== "SUSPENDED" && (
                      <form action={decideInstitution}>
                        <input type="hidden" name="institutionId" value={institution.id} />
                        <input type="hidden" name="decision" value="SUSPENDED" />
                        <button
                          type="submit"
                          className="rounded-lg px-2.5 py-1 text-xs font-semibold text-red-600 ring-1 ring-red-200 hover:bg-red-50"
                        >
                          Suspend
                        </button>
                      </form>
                    )}
                  </div>
                </td>
              </tr>
            ))}
            {institutions.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-slate-500">
                  No institutions registered yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}
