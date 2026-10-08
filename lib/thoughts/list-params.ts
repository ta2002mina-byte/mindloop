import { isThoughtCategory, isThoughtStatus } from "@/lib/constants/thoughts";
import type { ThoughtListFilters } from "@/lib/thoughts/queries";

export type RawSearchParams = Record<string, string | string[] | undefined>;

function first(value: string | string[] | undefined): string {
  if (Array.isArray(value)) return value[0] ?? "";
  return value ?? "";
}

/** Anything unexpected in the URL falls back to the default rather than erroring. */
export function parseThoughtListParams(params: RawSearchParams): ThoughtListFilters {
  const search = first(params.q).slice(0, 80);
  const categoryParam = first(params.category);
  const statusParam = first(params.status);
  const pageNumber = Number.parseInt(first(params.page), 10);

  return {
    search,
    category: isThoughtCategory(categoryParam) ? categoryParam : "all",
    status: isThoughtStatus(statusParam) ? statusParam : "all",
    page: Number.isFinite(pageNumber) && pageNumber > 0 ? pageNumber : 1,
  };
}

/** Builds a `?q=&category=...` string, leaving defaults out so URLs stay short. */
export function buildThoughtListQuery(filters: Partial<ThoughtListFilters>): string {
  const params = new URLSearchParams();
  if (filters.search) params.set("q", filters.search);
  if (filters.category && filters.category !== "all") params.set("category", filters.category);
  if (filters.status && filters.status !== "all") params.set("status", filters.status);
  if (filters.page && filters.page > 1) params.set("page", String(filters.page));

  const query = params.toString();
  return query ? `?${query}` : "";
}
