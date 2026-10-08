import { MiniBars } from "@/components/charts/bar-chart";
import { RelatedThoughts } from "@/components/patterns/related-thoughts";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { TriggerSummary } from "@/lib/trigger-detector";

export function TriggerCard({ trigger, weeks }: { trigger: TriggerSummary; weeks: number }) {
  return (
    <Card className="flex h-full flex-col">
      <CardHeader>
        <div className="flex items-start justify-between gap-3">
          <CardTitle className="break-anywhere text-base">{trigger.label}</CardTitle>
          <Badge variant="primary" className="shrink-0">
            {trigger.count} {trigger.count === 1 ? "entry" : "entries"}
          </Badge>
        </div>
        <p className="text-sm text-muted-foreground">{trigger.blurb}</p>
      </CardHeader>

      <CardContent className="flex flex-1 flex-col gap-4">
        {trigger.matchedTerms.length > 0 ? (
          <p className="text-sm text-muted-foreground">
            Based on words like{" "}
            {trigger.matchedTerms.map((term, index) => (
              <span key={term}>
                {index > 0 ? ", " : ""}
                <span className="font-medium text-foreground">&ldquo;{term}&rdquo;</span>
              </span>
            ))}
            .
          </p>
        ) : null}

        {trigger.relatedPatterns.length > 0 ? (
          <div className="space-y-2">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Related patterns</p>
            <ul className="flex flex-wrap gap-2">
              {trigger.relatedPatterns.map((pattern) => (
                <li key={pattern.id}>
                  <Badge variant="outline">
                    {pattern.label}
                    <span className="tabular-nums text-muted-foreground">×{pattern.count}</span>
                  </Badge>
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        <div className="space-y-1.5">
          <p className="text-xs text-muted-foreground">Timeline: entries per week, last {weeks} weeks</p>
          <MiniBars values={trigger.timeline.map((bucket) => bucket.count)} ariaLabel={`${trigger.label} entries per week, oldest to newest`} />
        </div>

        <div className="mt-auto">
          <RelatedThoughts thoughts={trigger.thoughts} total={trigger.count} />
        </div>
      </CardContent>
    </Card>
  );
}
