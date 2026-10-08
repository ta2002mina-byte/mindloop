"use client";

import { Search, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";

import { SelectField } from "@/components/forms/select-field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ROUTES } from "@/lib/constants/routes";
import { STATUS_LABELS, THOUGHT_CATEGORIES, THOUGHT_STATUSES } from "@/lib/constants/thoughts";
import { buildThoughtListQuery } from "@/lib/thoughts/list-params";
import type { ThoughtListFilters } from "@/lib/thoughts/queries";
import type { ThoughtCategory, ThoughtStatus } from "@/types";

const SEARCH_DEBOUNCE_MS = 350;

/** Filters live in the URL, so a filtered list can be shared, bookmarked and refreshed. */
export function ThoughtFilters({ filters }: { filters: ThoughtListFilters }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [search, setSearch] = useState(filters.search);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Keep the box in step with the URL when the user navigates back or clears filters.
  useEffect(() => {
    setSearch(filters.search);
  }, [filters.search]);

  const push = (next: Partial<ThoughtListFilters>) => {
    // Any filter change resets to page 1: page 4 of the old result set means nothing.
    const query = buildThoughtListQuery({ ...filters, page: 1, ...next });
    startTransition(() => router.replace(`${ROUTES.thoughts}${query}`, { scroll: false }));
  };

  const onSearchChange = (value: string) => {
    setSearch(value);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => push({ search: value }), SEARCH_DEBOUNCE_MS);
  };

  useEffect(() => {
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, []);

  const hasFilters = Boolean(filters.search) || filters.category !== "all" || filters.status !== "all";

  return (
    <div className="mb-4 grid gap-3 sm:mb-6 sm:grid-cols-2 lg:grid-cols-[minmax(0,1fr)_11rem_11rem_auto] lg:items-end">
      <div className="space-y-2">
        <Label htmlFor="thought-search" className="sr-only">
          Search your thoughts
        </Label>
        <div className="relative">
          <Search
            aria-hidden="true"
            className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
          />
          <Input
            id="thought-search"
            type="search"
            value={search}
            placeholder="Search titles, thoughts and triggers"
            className="pl-10"
            onChange={(event) => onSearchChange(event.target.value)}
          />
        </div>
      </div>

      <SelectField
        label="Category"
        srOnlyLabel
        value={filters.category}
        onChange={(event) =>
          push({ category: event.target.value === "all" ? "all" : (event.target.value as ThoughtCategory) })
        }
      >
        <option value="all">All categories</option>
        {THOUGHT_CATEGORIES.map((category) => (
          <option key={category} value={category}>
            {category}
          </option>
        ))}
      </SelectField>

      <SelectField
        label="Status"
        srOnlyLabel
        value={filters.status}
        onChange={(event) =>
          push({ status: event.target.value === "all" ? "all" : (event.target.value as ThoughtStatus) })
        }
      >
        <option value="all">All statuses</option>
        {THOUGHT_STATUSES.map((status) => (
          <option key={status} value={status}>
            {STATUS_LABELS[status]}
          </option>
        ))}
      </SelectField>

      <div className="flex items-center gap-2">
        {hasFilters ? (
          <Button
            type="button"
            variant="ghost"
            onClick={() => {
              setSearch("");
              push({ search: "", category: "all", status: "all" });
            }}
          >
            <X aria-hidden="true" />
            Clear
          </Button>
        ) : null}
        <span aria-live="polite" className="text-xs text-muted-foreground">
          {isPending ? "Updating…" : ""}
        </span>
      </div>
    </div>
  );
}
