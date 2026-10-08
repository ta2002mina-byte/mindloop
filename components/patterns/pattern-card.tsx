import { MiniBars } from "@/components/charts/bar-chart";
import { RelatedThoughts } from "@/components/patterns/related-thoughts";
import { TrendBadge } from "@/components/patterns/trend-badge";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { PatternSummary } from "@/lib/pattern-detector";

interface PatternCardProps {
  pattern: PatternSummary;
  totalEntries: number;
  weeks: number;
}

export function PatternCard({ pattern, totalEntries, weeks }: PatternCardProps) {
  return (
    <Card className="flex h-full flex-col">
      <CardHeader>
        <div className="flex items-start justify-between gap-3">
          <CardTitle className="text-base">{pattern.label}</CardTitle>
          <span className="shrink-0 font-display text-2xl font-semibold tabular-nums">{pattern.count}</span>
        </div>
        <CardDescription>{pattern.description}</CardDescription>
      </CardHeader>

      <CardContent className="flex flex-1 flex-col gap-4">
        <div className="space-y-1.5">
          <div className="flex items-baseline justify-between gap-3 text-sm">
            <span className="text-muted-foreground">Frequency</span>
            <span className="tabular-nums">
              {pattern.count} of {totalEntries} recent entries ({pattern.share}%)
            </span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-muted" role="img" aria-label={`${pattern.share}% of recent entries`}>
            <div className="h-full rounded-full bg-primary transition-[width] duration-700" style={{ width: `${Math.max(pattern.share, 4)}%` }} />
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <TrendBadge trend={pattern.trend} />
        </div>

        <div className="space-y-1.5">
          <p className="text-xs text-muted-foreground">Timeline: entries per week, last {weeks} weeks</p>
          <MiniBars values={pattern.timeline.map((bucket) => bucket.count)} ariaLabel={`${pattern.label} entries per week, oldest to newest`} />
        </div>

        {pattern.matchedTerms.length > 0 ? (
          <p className="text-sm text-muted-foreground">
            Based on words like{" "}
            {pattern.matchedTerms.map((term, index) => (
              <span key={term}>
                {index > 0 ? ", " : ""}
                <span className="font-medium text-foreground">&ldquo;{term}&rdquo;</span>
              </span>
            ))}
            .
          </p>
        ) : null}

        {pattern.triggers.length > 0 ? (
          <div className="space-y-2">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Related triggers</p>
            <ul className="flex flex-wrap gap-2">
              {pattern.triggers.map((trigger) => (
                <li key={trigger.label}>
                  <Badge variant="outline" className="max-w-full whitespace-normal">
                    <span className="break-anywhere">{trigger.label}</span>
                    <span className="tabular-nums text-muted-foreground">×{trigger.count}</span>
                  </Badge>
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        <div className="mt-auto">
          <RelatedThoughts thoughts={pattern.thoughts} total={pattern.count} />
        </div>
      </CardContent>
    </Card>
  );
}
