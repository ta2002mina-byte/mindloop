import { Skeleton } from "@/components/ui/skeleton";

export default function DecisionRoomLoading() {
  return (
    <div role="status" aria-label="Loading this decision" className="space-y-6">
      <div className="space-y-2">
        <Skeleton className="h-4 w-28" />
        <Skeleton className="h-8 w-80 max-w-full" />
        <Skeleton className="h-4 w-48" />
      </div>
      <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
        <Skeleton className="h-96 rounded-2xl" />
        <Skeleton className="h-96 rounded-2xl" />
        <Skeleton className="h-96 rounded-2xl" />
      </div>
      <span className="sr-only">Loading…</span>
    </div>
  );
}
