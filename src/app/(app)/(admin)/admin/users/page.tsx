import type { Metadata } from "next";
import Link from "next/link";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/auth/dal";
import { setUserRole, setUserStatus } from "@/server/cms/actions";
import { SELECT_CLASS } from "@/components/admin/formStyles";
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
import {
  AddUserModal,
  ViewUserModal,
  EditUserModal,
  DeleteUserModal,
} from "@/components/admin/UserModals";
import { readSort, sortHref } from "@/lib/admin/sort";
import { readPagination } from "@/lib/admin/pagination";
import { Pagination } from "@/components/admin/Pagination";
import type { Prisma } from "@/generated/prisma/client";

export const metadata: Metadata = { title: "Users · Admin" };

const ROLE_LABELS = {
  PARTICIPANT: "Participant",
  INSTITUTION_MODERATOR: "Institution moderator",
  ADMIN: "Admin",
  SUPER_ADMIN: "Super admin",
} as const;

/** What may be sorted on, and the ordering each one means. */
const SORTS = {
  name: (dir) => [{ profile: { fullName: dir } }],
  email: (dir) => [{ email: dir }],
  role: (dir) => [{ role: dir }],
  status: (dir) => [{ status: dir }],
  joined: (dir) => [{ createdAt: dir }],
} satisfies Record<string, (dir: "asc" | "desc") => Prisma.UserOrderByWithRelationInput[]>;

type SortKey = keyof typeof SORTS;
const SORT_KEYS = Object.keys(SORTS) as SortKey[];

export default async function AdminUsersPage(props: PageProps<"/admin/users">) {
  const actor = await requireRole("ADMIN");
  const params = await props.searchParams;
  const search = typeof params.q === "string" ? params.q.trim() : "";
  const sort = readSort(params, SORT_KEYS, { key: "joined", dir: "desc" });
  const { page, pageSize, skip, take } = readPagination(params, 15);

  const where: Prisma.UserWhereInput = search
    ? {
        OR: [
          { email: { contains: search, mode: "insensitive" } },
          { profile: { fullName: { contains: search, mode: "insensitive" } } },
        ],
      }
    : {};

  const [totalUsers, users] = await Promise.all([
    db.user.count({ where }),
    db.user.findMany({
      where,
      orderBy: SORTS[sort.key](sort.dir),
      skip,
      take,
      include: {
        profile: { select: { fullName: true, handle: true, phone: true } },
        _count: { select: { registrations: true } },
      },
    }),
  ]);

  const isSuper = actor.role === "SUPER_ADMIN";
  const href = (column: SortKey) => sortHref("/admin/users", params, sort, column);

  return (
    <>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Users</h1>
          <p className="mt-1 text-sm text-slate-600">
            {isSuper
              ? "Full user management — view, add, edit role/profile, suspend, or delete accounts."
              : "View, edit, suspend, or delete non-admin user accounts."}
          </p>
        </div>
        <AddUserModal isSuper={isSuper} />
      </div>

      <form method="get" className="mt-4 flex gap-2">
        <input
          name="q"
          type="search"
          defaultValue={search}
          placeholder="Search name or email…"
          className="w-full max-w-sm rounded-lg border border-slate-200 px-3 py-2.5 text-sm focus:border-bdaio-blue focus:outline-none focus:ring-2 focus:ring-bdaio-blue/30"
        />
        <input type="hidden" name="sort" value={sort.key} />
        <input type="hidden" name="dir" value={sort.dir} />
        <button
          type="submit"
          className="rounded-lg bg-white px-4 py-2.5 text-sm font-semibold text-bdaio-blue ring-1 ring-slate-200 hover:bg-slate-50"
        >
          Search
        </button>
      </form>

      <div className="mt-6">
        <DataTable minWidth={880}>
          <THead>
            <SortableTh column="name" current={sort} href={href("name")}>
              Person
            </SortableTh>
            <SortableTh column="role" current={sort} href={href("role")}>
              Role
            </SortableTh>
            <SortableTh column="status" current={sort} href={href("status")}>
              Status
            </SortableTh>
            <SortableTh column="joined" current={sort} href={href("joined")}>
              Joined
            </SortableTh>
            <Th align="right" srOnly="Actions" />
          </THead>

          <TBody>
            {users.length === 0 && (
              <EmptyRow colSpan={5}>
                {search ? `No one matches “${search}”.` : "No users yet."}
              </EmptyRow>
            )}

            {users.map((user) => {
              const isSelf = user.id === actor.id;
              const targetIsAdmin =
                user.role === "ADMIN" || user.role === "SUPER_ADMIN";
              // Mirrors the server rule, so the UI never offers a blocked action.
              const mayEdit = !isSelf && (isSuper || !targetIsAdmin);

              return (
                <Tr key={user.id}>
                  <Td>
                    <p className="font-medium text-slate-900">
                      {user.profile?.fullName ?? "—"}
                      {isSelf && (
                        <span className="ml-1.5 text-xs text-slate-500">(you)</span>
                      )}
                    </p>
                    <p className="text-xs text-slate-500">{user.email}</p>
                    <p className="mt-0.5 text-xs text-slate-500">
                      {user._count.registrations} registration
                      {user._count.registrations === 1 ? "" : "s"}
                    </p>
                  </Td>

                  <Td>
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
                        <button type="submit" className={ACTION_CLASS.normal}>
                          Set
                        </button>
                      </form>
                    ) : (
                      <span className="text-slate-700">{ROLE_LABELS[user.role]}</span>
                    )}
                  </Td>

                  <Td>
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
                      <p className="mt-1 text-xs text-slate-500">unverified</p>
                    )}
                  </Td>

                  <Td>
                    <span className="whitespace-nowrap text-xs text-slate-500">
                      {user.createdAt.toLocaleDateString("en-GB", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })}
                    </span>
                  </Td>

                  <RowActions>
                    <ViewUserModal user={user} />
                    {mayEdit && <EditUserModal user={user} isSuper={isSuper} />}
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
                          className={
                            user.status === "SUSPENDED"
                              ? ACTION_CLASS.good
                              : ACTION_CLASS.danger
                          }
                        >
                          {user.status === "SUSPENDED" ? "Reinstate" : "Suspend"}
                        </button>
                      </form>
                    )}
                    {mayEdit && <DeleteUserModal user={user} />}
                  </RowActions>
                </Tr>
              );
            })}
          </TBody>
        </DataTable>
        <Pagination
          page={page}
          pageSize={pageSize}
          totalItems={totalUsers}
          basePath="/admin/users"
          searchParams={params}
        />
      </div>

      <p className="mt-3 text-xs text-slate-500">
        You have full administrative control: view details, create new user accounts, update profile &amp; role details, suspend active sessions, or permanently delete accounts.
      </p>
    </>
  );
}
