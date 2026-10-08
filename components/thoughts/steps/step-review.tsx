"use client";

import { CalendarClock, Flag } from "lucide-react";

import { ThoughtSummary } from "@/components/thoughts/thought-summary";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PRIORITY_LABELS } from "@/lib/constants/thoughts";
import type { ThoughtDraft } from "@/lib/thoughts/draft";
import { summaryFromDraft } from "@/lib/thoughts/summary";
import { formatDateOnly } from "@/utils/date";

export function StepReview({ draft }: { draft: ThoughtDraft }) {
  const data = summaryFromDraft(draft);

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="space-y-1">
        <p className="text-sm text-muted-foreground">Title</p>
        <p className="break-anywhere text-xl font-semibold">{data.title}</p>
      </div>

      <ThoughtSummary
        data={data}
        actionSlot={
          <Card className={data.action ? "border-signal/40" : undefined}>
            <CardHeader>
              <CardTitle className="text-base">Next action</CardTitle>
              <CardDescription>The smallest useful step.</CardDescription>
            </CardHeader>
            <CardContent>
              {data.action ? (
                <div className="space-y-3">
                  <p className="break-anywhere font-medium leading-snug">{data.action.title}</p>
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="outline">
                      <Flag className="h-3 w-3" aria-hidden="true" />
                      {PRIORITY_LABELS[data.action.priority]} priority
                    </Badge>
                    {data.action.dueDate ? (
                      <Badge variant="outline">
                        <CalendarClock className="h-3 w-3" aria-hidden="true" />
                        Due {formatDateOnly(data.action.dueDate)}
                      </Badge>
                    ) : null}
                  </div>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  No action set. You can add one any time from the thought itself.
                </p>
              )}
            </CardContent>
          </Card>
        }
      />
    </div>
  );
}
