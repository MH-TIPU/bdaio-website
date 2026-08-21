import type { Metadata } from "next";
import Link from "next/link";
import { db } from "@/lib/db";
import { decideInstitution } from "@/server/community/actions";
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

import { readPagination } from "@/lib/admin/pagination";
import { Pagination } from "@/components/admin/Pagination";

export const metadata: Metadata = { title: "Institutions · Admin" };

const STATUS_STYLES = {
  PENDING: "bg-amber-50 text-amber-800",
  APPROVED: "bg-emerald-50 text-emerald-700",
  SUSPENDED: "bg-red-50 text-red-700",
} as const;

/**
 * What may be sorted on, and the ordering each one means.
 *
 * The status ordering follows the enum — pending, approved, suspended — so
 * ascending puts what needs reviewing at the top, which is the default.
 */
const SORTS = {
  name: (dir) => [{ name: dir }],
  members: (dir) => [{ memberships: { _count: dir } }],
  status: (dir) => [{ status: dir }, { createdAt: "desc" }],
  added: (dir) => [{ createdAt: dir }],
} satisfies Record<
  string,
  (dir: "asc" | "desc") => Prisma.InstitutionOrderByWithRelationInput[]
>;

type SortKey = keyof typeof SORTS;
const SORT_KEYS = Object.keys(SORTS) as SortKey[];

export default async function AdminInstitutionsPage(
  props: PageProps<"/admin/institutions">,
) {
  const params = await props.searchParams;
  const sort = readSort(params, SORT_KEYS, { key: "status", dir: "asc" });
  const { page, pageSize, skip, take } = readPagination(params, 15);

  const [totalInstitutions, institutions, pendingCount] = await Promise.all([
    db.institution.count(),
    db.institution.findMany({
      orderBy: SORTS[sort.key](sort.dir),
      skip,
      take,
      include: {
        _count: { select: { memberships: true } },
        memberships: {
          where: { membershipRole: "MODERATOR" },
          include: {
            user: { select: { email: true, profile: { select: { fullName: true } } } },
          },
        },
      },
    }),
    db.institution.count({ where: { status: "PENDING" } }),
  ]);
  const href = (column: SortKey) =>
    sortHref("/admin/institutions", params, sort, column);

  return (
    <>
      <h1 className="text-2xl font-bold text-slate-900">Institutions</h1>
      <p className="mt-1 text-sm text-slate-600">
        Approving an institution makes it public, marks it verified, and installs
        its moderators — who can then verify their own students.
      </p>

      {pendingCount > 0 && (
        <p className="mt-4 rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-800">
          {pendingCount} awaiting review.
        </p>
      )}

      <div className="mt-6">
        <DataTable minWidth={820}>
          <THead>
            <SortableTh column="name" current={sort} href={href("name")}>
              Institution
            </SortableTh>
            <Th>Proposed by</Th>
            <SortableTh column="members" current={sort} href={href("members")}>
              Members
            </SortableTh>
            <SortableTh column="status" current={sort} href={href("status")}>
              Status
            </SortableTh>
            <SortableTh column="added" current={sort} href={href("added")}>
              Added
            </SortableTh>
            <Th align="right" srOnly="Actions" />
          </THead>

          <TBody>
            {institutions.length === 0 && (
              <EmptyRow colSpan={6}>No institutions registered yet.</EmptyRow>
            )}

            {institutions.map((institution) => (
              <Tr key={institution.id}>
                <Td>
                  <p className="font-medium text-slate-900">{institution.name}</p>
                  <p className="text-xs text-slate-500">
                    {institution.type.charAt(0) + institution.type.slice(1).toLowerCase()}
                    {institution.district ? ` · ${institution.district}` : ""}
                  </p>
                  {institution.status === "APPROVED" && (
                    <Link
                      href={`/institutions/${institution.slug}`}
                      className="text-xs font-semibold text-bdaio-blue hover:underline"
                    >
                      View public page
                    </Link>
                  )}
                </Td>

                <Td>
                  {institution.memberships.map((m) => (
                    <p key={m.id} className="text-xs text-slate-600">
                      {m.user.profile?.fullName ?? m.user.email}
                    </p>
                  ))}
                  {institution.memberships.length === 0 && (
                    <span className="text-xs text-slate-400">—</span>
                  )}
                </Td>

                <Td>
                  <span className="text-slate-700">{institution._count.memberships}</span>
                </Td>

                <Td>
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${STATUS_STYLES[institution.status]}`}
                  >
                    {institution.status.charAt(0) +
                      institution.status.slice(1).toLowerCase()}
                  </span>
                </Td>

                <Td>
                  <span className="whitespace-nowrap text-xs text-slate-500">
                    {institution.createdAt.toLocaleDateString("en-GB", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                    })}
                  </span>
                </Td>

                <RowActions>
                  {institution.status !== "APPROVED" && (
                    <form action={decideInstitution}>
                      <input type="hidden" name="institutionId" value={institution.id} />
                      <input type="hidden" name="decision" value="APPROVED" />
                      <button type="submit" className={ACTION_CLASS.good}>
                        Approve
                      </button>
                    </form>
                  )}
                  {institution.status !== "SUSPENDED" && (
                    <form action={decideInstitution}>
                      <input type="hidden" name="institutionId" value={institution.id} />
                      <input type="hidden" name="decision" value="SUSPENDED" />
                      <button type="submit" className={ACTION_CLASS.danger}>
                        Suspend
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
          totalItems={totalInstitutions}
          basePath="/admin/institutions"
          searchParams={params}
        />
      </div>
    </>
  );
}
