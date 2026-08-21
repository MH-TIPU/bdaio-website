import Link from "next/link";
import { paginationHref } from "@/lib/admin/pagination";

type PaginationProps = {
  page: number;
  pageSize: number;
  totalItems: number;
  basePath: string;
  searchParams: Record<string, string | string[] | undefined>;
};

export function Pagination({
  page,
  pageSize,
  totalItems,
  basePath,
  searchParams,
}: PaginationProps) {
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  if (totalItems <= 0) return null;

  const startItem = (page - 1) * pageSize + 1;
  const endItem = Math.min(page * pageSize, totalItems);

  // Generate range of page numbers to display
  const pages: (number | "...")[] = [];
  if (totalPages <= 7) {
    for (let i = 1; i <= totalPages; i++) pages.push(i);
  } else {
    pages.push(1);
    if (page > 3) pages.push("...");
    const start = Math.max(2, page - 1);
    const end = Math.min(totalPages - 1, page + 1);
    for (let i = start; i <= end; i++) pages.push(i);
    if (page < totalPages - 2) pages.push("...");
    pages.push(totalPages);
  }

  const hasPrev = page > 1;
  const hasNext = page < totalPages;

  return (
    <div className="mt-4 flex flex-wrap items-center justify-between gap-4 border-t border-slate-200/80 pt-4 text-xs text-slate-600">
      <div>
        Showing <span className="font-semibold text-slate-900">{startItem}</span> to{" "}
        <span className="font-semibold text-slate-900">{endItem}</span> of{" "}
        <span className="font-semibold text-slate-900">{totalItems}</span> entries
      </div>

      <div className="flex items-center gap-1">
        {/* Previous Button */}
        {hasPrev ? (
          <Link
            href={paginationHref(basePath, searchParams, page - 1)}
            className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 font-semibold text-slate-700 hover:bg-slate-50 transition shadow-2xs"
          >
            ← Prev
          </Link>
        ) : (
          <span className="rounded-lg border border-slate-100 bg-slate-50 px-3 py-1.5 font-semibold text-slate-400 cursor-not-allowed">
            ← Prev
          </span>
        )}

        {/* Page Numbers */}
        <div className="flex items-center gap-1 px-1">
          {pages.map((p, idx) => {
            if (p === "...") {
              return (
                <span key={`dots-${idx}`} className="px-2 py-1 text-slate-400 select-none">
                  …
                </span>
              );
            }

            const isCurrent = p === page;
            return isCurrent ? (
              <span
                key={p}
                className="rounded-lg bg-bdaio-blue px-3 py-1.5 font-bold text-white shadow-2xs"
              >
                {p}
              </span>
            ) : (
              <Link
                key={p}
                href={paginationHref(basePath, searchParams, p)}
                className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 font-semibold text-slate-700 hover:bg-slate-50 transition"
              >
                {p}
              </Link>
            );
          })}
        </div>

        {/* Next Button */}
        {hasNext ? (
          <Link
            href={paginationHref(basePath, searchParams, page + 1)}
            className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 font-semibold text-slate-700 hover:bg-slate-50 transition shadow-2xs"
          >
            Next →
          </Link>
        ) : (
          <span className="rounded-lg border border-slate-100 bg-slate-50 px-3 py-1.5 font-semibold text-slate-400 cursor-not-allowed">
            Next →
          </span>
        )}
      </div>
    </div>
  );
}
