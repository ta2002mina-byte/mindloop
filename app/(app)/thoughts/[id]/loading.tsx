import { Skeleton } from "@/components/ui/skeleton";

export default function ThoughtDetailLoading() {
  return (
    <div role="status" aria-label="Loading this thought" className="space-y-6">
      <div className="space-y-2">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-8 w-96 max-w-full" />
        <Skeleton className="h-9 w-64" />
      </div>
      <Skeleton className="h-48 rounded-2xl" />
      <div className="grid gap-4 lg:grid-cols-2">
        <Skeleton className="h-44 rounded-2xl" />
        <Skeleton className="h-44 rounded-2xl" />
      </div>
      <Skeleton className="h-40 rounded-2xl" />
      <span className="sr-only">Loading…</span>
    </div>
  );
}
