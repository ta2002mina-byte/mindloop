import { ThoughtListSkeleton } from "@/components/thoughts/thought-list-skeleton";
import { Skeleton } from "@/components/ui/skeleton";

export default function ThoughtsLoading() {
  return (
    <>
      <div className="mb-6 space-y-2 sm:mb-8">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-80 max-w-full" />
      </div>
      <ThoughtListSkeleton />
    </>
  );
}
