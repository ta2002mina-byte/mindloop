import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ROUTES, thoughtRoute } from "@/lib/constants/routes";
import { PRIORITY_LABELS } from "@/lib/constants/thoughts";
import type { DashboardData } from "@/lib/dashboard/queries";
import { cn } from "@/lib/utils";
import { describeDueDate } from "@/utils/date";

/** The most pressing open action across all thoughts: soonest due date first, then oldest. */
export function TodaysAction({ action }: { action: DashboardData["todayAction"] }) {
  const due = describeDueDate(action?.dueDate);

  return (
    <Card className={cn(action && "border-signal/40")}>
      <CardHeader>
        <CardTitle className="text-base">Today&apos;s action</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {action ? (
          <>
            <p className="break-anywhere text-lg font-medium leading-snug">{action.title}</p>
            <p className="text-sm text-muted-foreground">
              From{" "}
              <Link href={thoughtRoute(action.thoughtId)} className="break-anywhere text-primary underline-offset-4 hover:underline">
                {action.thoughtTitle}
              </Link>
            </p>
            <p className="text-sm">
              <span className="font-medium">{PRIORITY_LABELS[action.priority]} priority</span>
              {due.label ? (
                <span className={cn("text-muted-foreground", due.isOverdue && "text-destructive")}>, {due.label.toLowerCase()}</span>
              ) : null}
            </p>
          </>
        ) : (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">No open action right now. The next one comes from a thought.</p>
            <Link href={ROUTES.newThought} className={cn(buttonVariants({ variant: "outline", size: "sm" }))}>
              Analyse a thought
            </Link>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
