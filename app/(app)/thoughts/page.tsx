import type { Metadata } from "next";
import Link from "next/link";
import { FlaskConical, Plus, SearchX } from "lucide-react";

import { EmptyState } from "@/components/shared/empty-state";
import { PageHeader } from "@/components/layout/page-header";
import { ThoughtCard } from "@/components/thoughts/thought-card";
import { ThoughtFilters } from "@/components/thoughts/thought-filters";
import { ThoughtPagination } from "@/components/thoughts/thought-pagination";
import { buttonVariants } from "@/components/ui/button";
import { ROUTES } from "@/lib/constants/routes";
import { parseThoughtListParams, type RawSearchParams } from "@/lib/thoughts/list-params";
import { listThoughts } from "@/lib/thoughts/queries";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Thought Lab" };

export default async function ThoughtLabPage({
  searchParams,
}: {
  searchParams: Promise<RawSearchParams>;
}) {
  const filters = parseThoughtListParams(await searchParams);
  const { items, total, page, pageCount, isLibraryEmpty } = await listThoughts(filters);

  return (
    <>
      <PageHeader
        title="Thought Lab"
        description="Take a tangled thought and turn it into something you can act on."
        actions={
          <Link href={ROUTES.newThought} className={cn(buttonVariants())}>
            <Plus aria-hidden="true" />
            New thought
          </Link>
        }
      />

      {isLibraryEmpty ? (
        <EmptyState
          icon={FlaskConical}
          title="Your lab is empty"
          description="Start with whatever is taking up the most space in your head right now. The flow walks you from the raw thought to one small next step."
          action={
            <Link href={ROUTES.newThought} className={cn(buttonVariants())}>
              <Plus aria-hidden="true" />
              Analyse your first thought
            </Link>
          }
        />
      ) : (
        <>
          <ThoughtFilters filters={filters} />

          {items.length === 0 ? (
            <EmptyState
              icon={SearchX}
              title="Nothing matches those filters"
              description="Try a different word, or widen the category and status filters."
            />
          ) : (
            <>
              <p className="sr-only" aria-live="polite">
                {total} {total === 1 ? "thought" : "thoughts"} found.
              </p>
              <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {items.map((thought) => (
                  <li key={thought.id}>
                    <ThoughtCard thought={thought} />
                  </li>
                ))}
              </ul>
              <ThoughtPagination filters={filters} page={page} pageCount={pageCount} total={total} />
            </>
          )}
        </>
      )}
    </>
  );
}
