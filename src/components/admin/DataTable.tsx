import Link from "next/link";
import type { ReactNode } from "react";
import type { Sort, SortDir } from "@/lib/admin/sort";

/**
 * The admin table.
 *
 * Every list screen had hand-written `<table>` markup, so padding, header
 * weight, row dividers and the empty state all differed slightly from page to
 * page. These are the shared parts; a page supplies the columns and the cells.
 *
 * Server components, so a sortable header is a link and the table needs no
 * JavaScript to work.
 */

export function DataTable({
  children,
  minWidth = 760,
}: {
  children: ReactNode;
  /** Below this the table scrolls sideways rather than crushing its columns. */
  minWidth?: number;
}) {
  return (
    <div className="overflow-x-auto rounded-xl bg-white shadow-sm ring-1 ring-slate-200">
      <table className="w-full text-left text-sm" style={{ minWidth }}>
        {children}
      </table>
    </div>
  );
}

export function THead({ children }: { children: ReactNode }) {
  return (
    <thead className="border-b border-slate-200 bg-slate-50">
      <tr>{children}</tr>
    </thead>
  );
}

export function TBody({ children }: { children: ReactNode }) {
  return <tbody className="divide-y divide-slate-100">{children}</tbody>;
}

export function Tr({ children }: { children: ReactNode }) {
  return <tr className="align-top transition-colors hover:bg-slate-50/60">{children}</tr>;
}

export function Th({
  children,
  align = "left",
  srOnly,
}: {
  children?: ReactNode;
  align?: "left" | "right";
  /** For the actions column: a header the eye skips but a screen reader needs. */
  srOnly?: string;
}) {
  return (
    <th
      scope="col"
      className={`px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500 ${
        align === "right" ? "text-right" : ""
      }`}
    >
      {srOnly ? <span className="sr-only">{srOnly}</span> : children}
    </th>
  );
}

/**
 * A column header that sorts.
 *
 * `aria-sort` is what tells a screen-reader user which column the table is
 * ordered by and which way — without it the arrow is decoration only they
 * cannot see.
 */
export function SortableTh<K extends string>({
  children,
  column,
  current,
  href,
  align = "left",
}: {
  children: ReactNode;
  column: K;
  current: Sort<K>;
  href: string;
  align?: "left" | "right";
}) {
  const active = current.key === column;
  const ariaSort: "ascending" | "descending" | "none" = active
    ? current.dir === "asc"
      ? "ascending"
      : "descending"
    : "none";

  return (
    <th
      scope="col"
      aria-sort={ariaSort}
      className={`px-4 py-3 text-xs font-semibold uppercase tracking-wide ${
        align === "right" ? "text-right" : ""
      } ${active ? "text-bdaio-blue" : "text-slate-500"}`}
    >
      <Link
        href={href}
        className="inline-flex items-center gap-1 rounded hover:text-bdaio-blue focus:outline-none focus-visible:ring-2 focus-visible:ring-bdaio-blue/40"
      >
        {children}
        <span aria-hidden="true" className={active ? "" : "text-slate-300"}>
          {active ? (current.dir === "asc" ? "↑" : "↓") : "↕"}
        </span>
      </Link>
    </th>
  );
}

export function Td({
  children,
  align = "left",
  className = "",
}: {
  children?: ReactNode;
  align?: "left" | "right";
  className?: string;
}) {
  return (
    <td className={`px-4 py-3 ${align === "right" ? "text-right" : ""} ${className}`}>
      {children}
    </td>
  );
}

/** The actions cell: a right-aligned row of controls that wraps rather than clips. */
export function RowActions({ children }: { children: ReactNode }) {
  return (
    <td className="px-4 py-3">
      <div className="flex flex-wrap items-center justify-end gap-1.5">{children}</div>
    </td>
  );
}

const ACTION_BASE =
  "rounded-lg px-2.5 py-1 text-xs font-semibold ring-1 transition-colors disabled:opacity-50";

export const ACTION_CLASS = {
  /** The ordinary action — view, edit, open. */
  normal: `${ACTION_BASE} text-bdaio-blue ring-slate-200 hover:bg-slate-50`,
  /** Destructive or otherwise not-undoable. */
  danger: `${ACTION_BASE} text-red-600 ring-red-200 hover:bg-red-50`,
  /** Restorative — reinstating, republishing. */
  good: `${ACTION_BASE} text-emerald-700 ring-emerald-200 hover:bg-emerald-50`,
} as const;

/** One row spanning the table, for when there is nothing to list. */
export function EmptyRow({ colSpan, children }: { colSpan: number; children: ReactNode }) {
  return (
    <tr>
      <td colSpan={colSpan} className="px-4 py-10 text-center text-sm text-slate-500">
        {children}
      </td>
    </tr>
  );
}

export type { Sort, SortDir };
