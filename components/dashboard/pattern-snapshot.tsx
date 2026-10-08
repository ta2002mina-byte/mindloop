import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ROUTES } from "@/lib/constants/routes";
import type { DashboardData } from "@/lib/dashboard/queries";
import { cn } from "@/lib/utils";

interface PatternSnapshotProps {
  patterns: DashboardData["topPatterns"];
  windowDays: number;
  entryCount: number;
}

export function PatternSnapshot({ patterns, windowDays, entryCount }: PatternSnapshotProps) {
  return (
    <Card>
      <CardHeader className="space-y-1.5">
        <CardTitle className="text-base">Pattern snapshot</CardTitle>
        <CardDescription>
          {patterns.length > 0
            ? `Where your last ${windowDays} days of entries show more activity.`
            : `Patterns appear once your last ${windowDays} days of entries have something in common.`}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {patterns.length === 0 ? (
          <p className="rounded-xl border border-dashed px-3.5 py-4 text-sm text-muted-foreground">
            {entryCount === 0 ? "No entries in this period yet." : "Nothing stands out yet."}
          </p>
        ) : (
          <>
            <ul className="space-y-4">
              {patterns.map((pattern) => (
                <li key={pattern.id}>
                  <div className="mb-1.5 flex items-baseline justify-between gap-3 text-sm">
                    <span>{pattern.label}</span>
                    <span className="tabular-nums text-muted-foreground">{pattern.share}%</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-muted" role="img" aria-label={`${pattern.share}% of recent entries`}>
                    <div className="h-full rounded-full bg-primary" style={{ width: `${Math.max(pattern.share, 4)}%` }} />
                  </div>
                </li>
              ))}
            </ul>
            <Link href={ROUTES.patterns} className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "mt-4 -ml-3")}>
              See all patterns
            </Link>
          </>
        )}
      </CardContent>
    </Card>
  );
}
