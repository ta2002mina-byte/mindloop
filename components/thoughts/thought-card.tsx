import Link from "next/link";
import { ArrowRight, CalendarClock, CheckCircle2 } from "lucide-react";

import { TrafficLightBadge } from "@/components/shared/traffic-light-badge";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { STATUS_LABELS } from "@/lib/constants/thoughts";
import { thoughtRoute } from "@/lib/constants/routes";
import { cn } from "@/lib/utils";
import type { ThoughtListItem } from "@/types";
import { describeDueDate, formatRelativeDate } from "@/utils/date";

const STATUS_VARIANT = {
  active: "primary",
  resolved: "success",
  archived: "muted",
} as const;

export function ThoughtCard({ thought }: { thought: ThoughtListItem }) {
  const action = thought.nextAction;
  const due = describeDueDate(action?.due_date);

  return (
    <Card className="group relative h-full transition-colors focus-within:border-primary/60 hover:border-primary/40">
      <CardContent className="flex h-full flex-col gap-4 p-5">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="outline">{thought.category}</Badge>
          <Badge variant={STATUS_VARIANT[thought.status]}>{STATUS_LABELS[thought.status]}</Badge>
          <TrafficLightBadge value={thought.traffic_light} variant="pill" className="ml-auto" />
        </div>

        <div className="min-w-0 space-y-1.5">
          <h3 className="break-anywhere font-semibold leading-snug">
            {/* The whole card is clickable through this stretched link. */}
            <Link
              href={thoughtRoute(thought.id)}
              className="rounded-sm outline-none after:absolute after:inset-0 after:rounded-2xl focus-visible:underline"
            >
              {thought.title}
            </Link>
          </h3>
          <p className="text-xs text-muted-foreground">{formatRelativeDate(thought.created_at)}</p>
        </div>

        <div className="mt-auto space-y-2 border-t pt-3">
          {action ? (
            <>
              <p className="flex items-start gap-2 text-sm">
                {action.completed ? (
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-success" aria-hidden="true" />
                ) : (
                  <ArrowRight className="mt-0.5 h-4 w-4 shrink-0 text-signal" aria-hidden="true" />
                )}
                <span className={cn("break-anywhere", action.completed && "text-muted-foreground line-through")}>
                  {action.title}
                </span>
              </p>
              {due.label && !action.completed ? (
                <p
                  className={cn(
                    "flex items-center gap-1.5 text-xs",
                    due.isOverdue ? "text-destructive" : "text-muted-foreground",
                  )}
                >
                  <CalendarClock className="h-3.5 w-3.5" aria-hidden="true" />
                  {due.label}
                </p>
              ) : null}
            </>
          ) : (
            <p className="text-sm text-muted-foreground">No next action yet.</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
