import Link from "next/link";

import { INSIGHT_RANGES, type InsightRange } from "@/lib/insights/range";
import { cn } from "@/lib/utils";

/** Plain links, so the range lives in the URL and works without JavaScript. */
export function InsightRangeTabs({ active, basePath }: { active: InsightRange; basePath: string }) {
  return (
    <nav aria-label="Time range" className="inline-flex rounded-xl border bg-card p-1">
      {INSIGHT_RANGES.map((range) => (
        <Link
          key={range}
          href={`${basePath}?range=${range}`}
          aria-current={range === active ? "page" : undefined}
          className={cn(
            "rounded-lg px-3 py-1.5 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
            range === active ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground",
          )}
        >
          {range} days
        </Link>
      ))}
    </nav>
  );
}
