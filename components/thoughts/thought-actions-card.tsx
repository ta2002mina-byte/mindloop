"use client";

import { CalendarClock, Check, Flag, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { FormAlert } from "@/components/forms/form-alert";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PRIORITY_LABELS } from "@/lib/constants/thoughts";
import { setActionCompleted } from "@/lib/thoughts/actions";
import { cn } from "@/lib/utils";
import type { ActionRow } from "@/types";
import { describeDueDate, formatDate } from "@/utils/date";

/** Checkbox plus details for each action attached to a thought. */
export function ThoughtActionsCard({ actions }: { actions: ActionRow[] }) {
  const router = useRouter();
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const toggle = async (action: ActionRow) => {
    setPendingId(action.id);
    setError(null);

    const result = await setActionCompleted(action.id, !action.completed);
    setPendingId(null);

    if (!result.ok) {
      setError(result.message);
      return;
    }
    router.refresh();
  };

  const hasOpenAction = actions.some((action) => !action.completed);

  return (
    <Card className={cn(hasOpenAction && "border-signal/40")}>
      <CardHeader>
        <CardTitle className="text-base">Next action</CardTitle>
        <CardDescription>The smallest useful step.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {error ? <FormAlert variant="error">{error}</FormAlert> : null}

        {actions.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No action set. Use Edit to add one whenever a step becomes clear.
          </p>
        ) : (
          <ul className="space-y-3">
            {actions.map((action) => {
              const due = describeDueDate(action.due_date);
              const isPending = pendingId === action.id;

              return (
                <li key={action.id} className="flex items-start gap-3 rounded-xl border bg-muted/20 p-3">
                  <button
                    type="button"
                    role="checkbox"
                    aria-checked={action.completed}
                    aria-label={action.completed ? `Mark "${action.title}" as not done` : `Mark "${action.title}" as done`}
                    disabled={isPending}
                    onClick={() => void toggle(action)}
                    className={cn(
                      "mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50",
                      action.completed
                        ? "border-success bg-success text-success-foreground"
                        : "border-input bg-card hover:border-primary",
                    )}
                  >
                    {isPending ? (
                      <Loader2 className="h-3 w-3 animate-spin" aria-hidden="true" />
                    ) : action.completed ? (
                      <Check className="h-3.5 w-3.5" aria-hidden="true" />
                    ) : null}
                  </button>

                  <div className="min-w-0 space-y-2">
                    <p
                      className={cn(
                        "break-anywhere font-medium leading-snug",
                        action.completed && "text-muted-foreground line-through",
                      )}
                    >
                      {action.title}
                    </p>
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant="outline">
                        <Flag className="h-3 w-3" aria-hidden="true" />
                        {PRIORITY_LABELS[action.priority]} priority
                      </Badge>
                      {action.completed && action.completed_at ? (
                        <Badge variant="success">Done {formatDate(action.completed_at)}</Badge>
                      ) : due.label ? (
                        <Badge variant="outline" className={due.isOverdue ? "text-destructive" : undefined}>
                          <CalendarClock className="h-3 w-3" aria-hidden="true" />
                          {due.label}
                        </Badge>
                      ) : null}
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
