import { Skeleton } from "@/components/ui/skeleton";

export function ThoughtListSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div role="status" aria-label="Loading your thoughts" className="space-y-4 sm:space-y-6">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-[minmax(0,1fr)_11rem_11rem]">
        <Skeleton className="h-11" />
        <Skeleton className="h-11" />
        <Skeleton className="h-11" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: count }).map((_, index) => (
          <Skeleton key={index} className="h-52 rounded-2xl" />
        ))}
      </div>
      <span className="sr-only">Loading…</span>
    </div>
  );
}
