import type { Metadata } from "next";
import Link from "next/link";
import { db } from "@/lib/db";
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

export const metadata: Metadata = { title: "Results · Admin" };

/**
 * What may be sorted on, and the ordering each one means.
 *
 * Sorting by round moves the *event* — rounds keep their own order within one
 * event, because "round 2 before round 1" is not a view anyone wants.
 *
 * State is absent: whether a round is published is read from its results in
 * the page, not stored on the round, so there is no column to order by.
 */
const SORTS = {
  round: (dir) => [{ event: { year: dir } }, { order: "asc" }],
  entries: (dir) => [{ registrations: { _count: dir } }],
  scored: (dir) => [{ results: { _count: dir } }],
  judges: (dir) => [{ judges: { _count: dir } }],
} satisfies Record<
  string,
  (dir: "asc" | "desc") => Prisma.RoundOrderByWithRelationInput[]
>;

type SortKey = keyof typeof SORTS;
const SORT_KEYS = Object.keys(SORTS) as SortKey[];

export default async function AdminResultsPage(props: PageProps<"/admin/results">) {
  const params = await props.searchParams;
  const sort = readSort(params, SORT_KEYS, { key: "round", dir: "desc" });

  // Only olympiad-style events have rounds to score.
  const rounds = await db.round.findMany({
    orderBy: SORTS[sort.key](sort.dir),
    include: {
      event: { select: { title: true, year: true } },
      _count: { select: { registrations: true, results: true, judges: true } },
      results: { where: { published: true }, select: { id: true }, take: 1 },
    },
  });

  const href = (column: SortKey) => sortHref("/admin/results", params, sort, column);

  return (
    <>
      <h1 className="text-2xl font-bold text-slate-900">Results</h1>
      <p className="mt-1 text-sm text-slate-600">
        Enter marks per round. Nothing is visible to participants until you
        publish.
      </p>

      <div className="mt-6">
        <DataTable minWidth={760}>
          <THead>
            <SortableTh column="round" current={sort} href={href("round")}>
              Round
            </SortableTh>
            <SortableTh column="entries" current={sort} href={href("entries")}>
              Entries
            </SortableTh>
            <SortableTh column="scored" current={sort} href={href("scored")}>
              Scored
            </SortableTh>
            <SortableTh column="judges" current={sort} href={href("judges")}>
              Judges
            </SortableTh>
            <Th>State</Th>
            <Th align="right" srOnly="Actions" />
          </THead>

          <TBody>
            {rounds.length === 0 && (
              <EmptyRow colSpan={6}>
                No rounds exist yet. Add rounds to an event first.
              </EmptyRow>
            )}

            {rounds.map((round) => (
              <Tr key={round.id}>
                <Td>
                  <p className="font-medium text-slate-900">{round.name}</p>
                  <p className="text-xs text-slate-500">
                    {round.event.title} ({round.event.year})
                  </p>
                </Td>

                <Td className="text-slate-700">{round._count.registrations}</Td>
                <Td className="text-slate-700">{round._count.results}</Td>
                <Td className="text-slate-700">{round._count.judges}</Td>

                <Td>
                  {round.results.length > 0 ? (
                    <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700">
                      Published
                    </span>
                  ) : round._count.results > 0 ? (
                    <span className="rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-semibold text-amber-800">
                      Draft
                    </span>
                  ) : (
                    <span className="text-xs text-slate-400">Not started</span>
                  )}
                </Td>

                <RowActions>
                  <Link
                    href={`/admin/results/${round.id}`}
                    className={ACTION_CLASS.normal}
                  >
                    Score
                  </Link>
                </RowActions>
              </Tr>
            ))}
          </TBody>
        </DataTable>
      </div>
    </>
  );
}
