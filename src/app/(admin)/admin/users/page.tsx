import type { Metadata } from "next";
import Link from "next/link";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/auth/dal";
import { setUserRole, setUserStatus } from "@/server/cms/actions";
import { SELECT_CLASS } from "@/components/admin/formStyles";

export const metadata: Metadata = { title: "Users · Admin" };

const ROLE_LABELS = {
  PARTICIPANT: "Participant",
  INSTITUTION_MODERATOR: "Institution moderator",
  ADMIN: "Admin",
  SUPER_ADMIN: "Super admin",
} as const;

export default async function AdminUsersPage(props: PageProps<"/admin/users">) {
  const actor = await requireRole("ADMIN");
  const { q } = await props.searchParams;
  const search = typeof q === "string" ? q.trim() : "";

  const users = await db.user.findMany({
    where: search
      ? {
          OR: [
            { email: { contains: search, mode: "insensitive" } },
            { profile: { fullName: { contains: search, mode: "insensitive" } } },
          ],
        }
      : {},
    orderBy: [{ role: "desc" }, { createdAt: "desc" }],
    take: 100,
    include: {
      profile: { select: { fullName: true, handle: true } },
      _count: { select: { registrations: true } },
    },
  });

  const isSuper = actor.role === "SUPER_ADMIN";

  return (
    <>
      <h1 className="text-2xl font-bold text-slate-900">Users</h1>
      <p className="mt-1 text-sm text-slate-600">
        {isSuper
          ? "You can change any role, including admins."
          : "Only a super admin can create or change admins."}
      </p>

      <form method="get" className="mt-4 flex gap-2">
        <input
          name="q"
          type="search"
          defaultValue={search}
          placeholder="Search name or email…"
          className="w-full max-w-sm rounded-lg border border-slate-200 px-3 py-2.5 text-sm focus:border-bdaio-blue focus:outline-none focus:ring-2 focus:ring-bdaio-blue/30"
        />
        <button
          type="submit"
          className="rounded-lg bg-white px-4 py-2.5 text-sm font-semibold text-bdaio-blue ring-1 ring-slate-200 hover:bg-slate-50"
        >
          Search
        </button>
      </form>

      <div className="mt-6 overflow-x-auto rounded-xl bg-white shadow-sm ring-1 ring-slate-100">
        <table className="w-full min-w-[760px] text-left text-sm">
          <thead className="border-b border-slate-100 bg-slate-50/70">
            <tr>
              <th className="px-4 py-3 font-semibold text-slate-700">Person</th>
              <th className="px-4 py-3 font-semibold text-slate-700">Role</th>
              <th className="px-4 py-3 font-semibold text-slate-700">Status</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {users.map((user) => {
              const isSelf = user.id === actor.id;
              const targetIsAdmin =
                user.role === "ADMIN" || user.role === "SUPER_ADMIN";
              // Mirrors the server rule, so the UI never offers a blocked action.
              const mayEdit = !isSelf && (isSuper || !targetIsAdmin);

              return (
                <tr key={user.id}>
                  <td className="px-4 py-3">
                    <p className="font-medium text-slate-900">
                      {user.profile?.fullName ?? "—"}
                      {isSelf && (
                        <span className="ml-1.5 text-xs text-slate-500">(you)</span>
                      )}
                    </p>
                    <p className="text-xs text-slate-500">{user.email}</p>
                    {user.profile?.handle && (
                      <Link
                        href={`/u/${user.profile.handle}`}
                        className="text-xs font-semibold text-bdaio-blue hover:underline"
                      >
                        /u/{user.profile.handle}
                      </Link>
                    )}
                  </td>

                  <td className="px-4 py-3">
                    {mayEdit ? (
                      <form action={setUserRole} className="flex items-center gap-2">
                        <input type="hidden" name="userId" value={user.id} />
                        <select
                          name="role"
                          defaultValue={user.role}
                          aria-label={`Role for ${user.email}`}
                          className={`${SELECT_CLASS} mt-0 w-auto py-1.5 text-xs`}
                        >
                          {Object.entries(ROLE_LABELS)
                            // Non-super admins cannot grant admin roles.
                            .filter(([value]) =>
                              isSuper
                                ? true
                                : value !== "ADMIN" && value !== "SUPER_ADMIN",
                            )
                            .map(([value, label]) => (
                              <option key={value} value={value}>
                                {label}
                              </option>
                            ))}
                        </select>
                        <button
                          type="submit"
                          className="rounded-lg px-2 py-1 text-xs font-semibold text-bdaio-blue ring-1 ring-slate-200 hover:bg-slate-50"
                        >
                          Set
                        </button>
                      </form>
                    ) : (
                      <span className="text-slate-700">{ROLE_LABELS[user.role]}</span>
                    )}
                  </td>

                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                        user.status === "ACTIVE"
                          ? "bg-emerald-50 text-emerald-700"
                          : user.status === "SUSPENDED"
                            ? "bg-red-50 text-red-700"
                            : "bg-amber-50 text-amber-800"
                      }`}
                    >
                      {user.status.charAt(0) + user.status.slice(1).toLowerCase()}
                    </span>
                    {!user.emailVerifiedAt && (
                      <span className="ml-1.5 text-xs text-slate-500">unverified</span>
                    )}
                  </td>

                  <td className="px-4 py-3 text-right">
                    {mayEdit && (
                      <form action={setUserStatus}>
                        <input type="hidden" name="userId" value={user.id} />
                        <input
                          type="hidden"
                          name="status"
                          value={user.status === "SUSPENDED" ? "ACTIVE" : "SUSPENDED"}
                        />
                        <button
                          type="submit"
                          className={`rounded-lg px-2.5 py-1 text-xs font-semibold ring-1 ${
                            user.status === "SUSPENDED"
                              ? "text-emerald-700 ring-emerald-200 hover:bg-emerald-50"
                              : "text-red-600 ring-red-200 hover:bg-red-50"
                          }`}
                        >
                          {user.status === "SUSPENDED" ? "Reinstate" : "Suspend"}
                        </button>
                      </form>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <p className="mt-3 text-xs text-slate-500">
        Suspending someone signs them out of every device immediately.
      </p>
    </>
  );
}
