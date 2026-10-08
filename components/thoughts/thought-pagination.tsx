import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { buttonVariants } from "@/components/ui/button";
import { ROUTES } from "@/lib/constants/routes";
import { buildThoughtListQuery } from "@/lib/thoughts/list-params";
import type { ThoughtListFilters } from "@/lib/thoughts/queries";
import { cn } from "@/lib/utils";

interface ThoughtPaginationProps {
  filters: ThoughtListFilters;
  page: number;
  pageCount: number;
  total: number;
}

/** Links rather than buttons, so pages are shareable and work without JavaScript. */
export function ThoughtPagination({ filters, page, pageCount, total }: ThoughtPaginationProps) {
  if (pageCount <= 1) return null;

  const hrefFor = (target: number) => `${ROUTES.thoughts}${buildThoughtListQuery({ ...filters, page: target })}`;
  const disabledClass = "pointer-events-none opacity-50";

  return (
    <nav aria-label="Thought pages" className="mt-6 flex items-center justify-between gap-3">
      <Link
        href={hrefFor(page - 1)}
        aria-disabled={page <= 1}
        className={cn(buttonVariants({ variant: "outline", size: "sm" }), page <= 1 && disabledClass)}
        scroll={false}
      >
        <ChevronLeft aria-hidden="true" />
        Previous
      </Link>

      <p className="text-sm text-muted-foreground" aria-live="polite">
        Page {page} of {pageCount}
        <span className="hidden sm:inline">, {total} in total</span>
      </p>

      <Link
        href={hrefFor(page + 1)}
        aria-disabled={page >= pageCount}
        className={cn(buttonVariants({ variant: "outline", size: "sm" }), page >= pageCount && disabledClass)}
        scroll={false}
      >
        Next
        <ChevronRight aria-hidden="true" />
      </Link>
    </nav>
  );
}
