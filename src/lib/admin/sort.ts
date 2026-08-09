/**
 * Sorting for admin tables, done in the URL.
 *
 * `?sort=name&dir=asc` rather than client-side state: the sort is then
 * shareable, survives a reload, and — because the ordering happens in the
 * database — still means something on a table that is paginated or capped. A
 * client-side sort would only reorder the rows that happened to be fetched,
 * which quietly answers a different question than the one asked.
 *
 * The column is checked against an allowlist per table, so a hand-edited query
 * string cannot reach a field the page never meant to order by.
 */

export type SortDir = "asc" | "desc";

export type Sort<K extends string> = { key: K; dir: SortDir };

type Params = Record<string, string | string[] | undefined>;

function one(params: Params, name: string): string | undefined {
  const value = params[name];
  return Array.isArray(value) ? value[0] : value;
}

/** The active sort, falling back to the table's default when absent or invalid. */
export function readSort<K extends string>(
  params: Params,
  allowed: readonly K[],
  fallback: Sort<K>,
): Sort<K> {
  const key = one(params, "sort");
  const dir = one(params, "dir");
  return {
    key: allowed.includes(key as K) ? (key as K) : fallback.key,
    dir: dir === "asc" || dir === "desc" ? dir : fallback.dir,
  };
}

/**
 * The link a column header points at.
 *
 * Clicking the column you are already sorted by flips the direction; any other
 * column starts at ascending, which is what people expect from a name or a
 * title. Other query parameters — a search term, a filter — are carried
 * through, so sorting never silently drops what you were looking at.
 */
export function sortHref<K extends string>(
  basePath: string,
  params: Params,
  current: Sort<K>,
  column: K,
): string {
  const next = new URLSearchParams();

  for (const [name, value] of Object.entries(params)) {
    if (name === "sort" || name === "dir" || value === undefined) continue;
    next.set(name, Array.isArray(value) ? (value[0] ?? "") : value);
  }

  next.set("sort", column);
  next.set("dir", current.key === column && current.dir === "asc" ? "desc" : "asc");

  return `${basePath}?${next.toString()}`;
}
