import Link from "next/link";

import { ROUTES } from "@/lib/constants/routes";
import { cn } from "@/lib/utils";

export const PATTERN_RANGES = [30, 90] as const;
export type PatternRange = (typeof PATTERN_RANGES)[number];

export function parsePatternRange(value: string | string[] | undefined): PatternRange {
  const raw = Array.isArray(value) ? value[0] : value;
  return raw === "90" ? 90 : 30;
}

/** Plain links, so the range lives in the URL and works without JavaScript. */
export function RangeTabs({ active }: { active: PatternRange }) {
  return (
    <nav aria-label="Time range" className="inline-flex rounded-xl border bg-card p-1">
      {PATTERN_RANGES.map((range) => (
        <Link
          key={range}
          href={`${ROUTES.patterns}?range=${range}`}
          aria-current={range === active ? "page" : undefined}
          className={cn(
            "rounded-lg px-3.5 py-1.5 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
            range === active ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground",
          )}
        >
          {range} days
        </Link>
      ))}
    </nav>
  );
}
