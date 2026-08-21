export type PaginationParams = {
  page: number;
  pageSize: number;
  skip: number;
  take: number;
};

export function readPagination(
  searchParams: Record<string, string | string[] | undefined>,
  defaultPageSize = 15,
): PaginationParams {
  const rawPage = typeof searchParams.page === "string" ? parseInt(searchParams.page, 10) : 1;
  const rawSize = typeof searchParams.pageSize === "string" ? parseInt(searchParams.pageSize, 10) : defaultPageSize;

  const page = Number.isNaN(rawPage) || rawPage < 1 ? 1 : rawPage;
  const pageSize = Number.isNaN(rawSize) || rawSize < 1 ? defaultPageSize : Math.min(rawSize, 100);

  const skip = (page - 1) * pageSize;
  const take = pageSize;

  return { page, pageSize, skip, take };
}

export function paginationHref(
  basePath: string,
  searchParams: Record<string, string | string[] | undefined>,
  targetPage: number,
): string {
  const params = new URLSearchParams();

  for (const [key, value] of Object.entries(searchParams)) {
    if (key === "page" || value === undefined) continue;
    if (Array.isArray(value)) {
      value.forEach((v) => params.append(key, v));
    } else {
      params.set(key, value);
    }
  }

  if (targetPage > 1) {
    params.set("page", String(targetPage));
  }

  const query = params.toString();
  return query ? `${basePath}?${query}` : basePath;
}
