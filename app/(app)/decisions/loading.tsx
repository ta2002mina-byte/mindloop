import { Skeleton } from "@/components/ui/skeleton";

export default function DecisionsLoading() {
  return (
    <div role="status" aria-label="Loading your decisions" className="space-y-6">
      <div className="space-y-2">
        <Skeleton className="h-8 w-52" />
        <Skeleton className="h-4 w-80 max-w-full" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <Skeleton className="h-44 rounded-2xl" />
        <Skeleton className="h-44 rounded-2xl" />
        <Skeleton className="h-44 rounded-2xl" />
      </div>
      <span className="sr-only">Loading…</span>
    </div>
  );
}
