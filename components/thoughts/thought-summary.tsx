import { Eye, MessageCircleQuestion } from "lucide-react";

import { TrafficLightBadge } from "@/components/shared/traffic-light-badge";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CONTROL_COLUMNS, TRAFFIC_LIGHT_MAP, describeIntensity } from "@/lib/constants/thoughts";
import type { ThoughtSummaryData } from "@/lib/thoughts/summary";
import { cn } from "@/lib/utils";

interface ThoughtSummaryProps {
  data: ThoughtSummaryData;
  /** The detail page passes an interactive action card; the review screen passes a static one. */
  actionSlot?: React.ReactNode;
}

function Section({
  title,
  description,
  children,
  className,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
        {description ? <CardDescription>{description}</CardDescription> : null}
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}

function ItemList({ items, emptyText }: { items: string[]; emptyText: string }) {
  if (items.length === 0) {
    return <p className="text-sm text-muted-foreground">{emptyText}</p>;
  }

  return (
    <ul className="space-y-2 text-sm">
      {items.map((item, index) => (
        <li key={`${index}-${item.slice(0, 12)}`} className="flex gap-2">
          <span aria-hidden="true" className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-muted-foreground/60" />
          <span className="break-anywhere">{item}</span>
        </li>
      ))}
    </ul>
  );
}

export function ThoughtSummary({ data, actionSlot }: ThoughtSummaryProps) {
  const light = TRAFFIC_LIGHT_MAP[data.trafficLight];

  return (
    <div className="space-y-4 sm:space-y-6">
      <Section title="Situation and thought">
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="outline">{data.category}</Badge>
            <TrafficLightBadge value={data.trafficLight} variant="pill" />
          </div>
          {data.trigger ? (
            <p className="text-sm text-muted-foreground">
              <span className="font-medium text-foreground">Trigger: </span>
              <span className="break-anywhere">{data.trigger}</span>
            </p>
          ) : (
            <p className="text-sm text-muted-foreground">No trigger noted.</p>
          )}
          <p className="whitespace-pre-wrap break-anywhere leading-relaxed">{data.rawText}</p>
        </div>
      </Section>

      <div className="grid gap-4 lg:grid-cols-2">
        <Section title="Facts" description="What you actually know happened." className="border-emerald-500/30">
          <div className="mb-3 flex items-center gap-2 text-xs font-medium text-emerald-700 dark:text-emerald-300">
            <Eye className="h-3.5 w-3.5" aria-hidden="true" />
            {data.facts.length} {data.facts.length === 1 ? "fact" : "facts"}
          </div>
          <ItemList items={data.facts} emptyText="No facts recorded." />
        </Section>

        <Section
          title="Stories"
          description="What you were assuming, predicting, or interpreting."
          className="border-amber-500/30"
        >
          <div className="mb-3 flex items-center gap-2 text-xs font-medium text-amber-700 dark:text-amber-300">
            <MessageCircleQuestion className="h-3.5 w-3.5" aria-hidden="true" />
            {data.stories.length} {data.stories.length === 1 ? "story" : "stories"}
          </div>
          <ItemList items={data.stories} emptyText="No stories recorded." />
        </Section>
      </div>

      <Section title="Emotion" description="Your own words, with how strong each one felt.">
        {data.emotions.length === 0 ? (
          <p className="text-sm text-muted-foreground">No feelings recorded.</p>
        ) : (
          <ul className="space-y-3">
            {data.emotions.map((emotion) => (
              <li key={emotion.id} className="space-y-1.5">
                <div className="flex items-baseline justify-between gap-3 text-sm">
                  <span className="break-anywhere font-medium">{emotion.emotion}</span>
                  <span className="shrink-0 tabular-nums text-muted-foreground">
                    {emotion.intensity} / 10, {describeIntensity(emotion.intensity)}
                  </span>
                </div>
                <div
                  className="h-1.5 w-full overflow-hidden rounded-full bg-muted"
                  role="img"
                  aria-label={`${emotion.emotion}: ${emotion.intensity} out of 10`}
                >
                  <div className="h-full rounded-full bg-primary/70" style={{ width: `${emotion.intensity * 10}%` }} />
                </div>
              </li>
            ))}
          </ul>
        )}
      </Section>

      <Section title="Control map" description="Where each piece of this sits.">
        <div className="grid gap-4 sm:grid-cols-3">
          {CONTROL_COLUMNS.map((column) => {
            const items = data.controlItems.filter((item) => item.controlType === column.value);
            return (
              <div key={column.value} className={cn("rounded-xl border p-3.5", column.accent)}>
                <p className="mb-2 text-sm font-medium">{column.title}</p>
                <ItemList items={items.map((item) => item.content)} emptyText="Nothing here." />
              </div>
            );
          })}
        </div>
      </Section>

      <Section title="Traffic light" description="How this entry reads right now.">
        <div className={cn("rounded-xl border p-3.5", light.border, light.tint)}>
          <p className={cn("text-sm font-medium", light.text)}>{light.label}</p>
          <p className="mt-1 text-sm text-muted-foreground">{light.explanation}</p>
        </div>
      </Section>

      {actionSlot ?? (
        <Section title="Next action" description="The smallest useful step.">
          <p className="text-sm text-muted-foreground">No action set.</p>
        </Section>
      )}
    </div>
  );
}
