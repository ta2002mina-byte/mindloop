import Link from "next/link";
import { FlaskConical } from "lucide-react";

import { TrafficLightBadge } from "@/components/shared/traffic-light-badge";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ROUTES, thoughtRoute } from "@/lib/constants/routes";
import type { DashboardData } from "@/lib/dashboard/queries";
import { cn } from "@/lib/utils";
import { formatRelativeDate } from "@/utils/date";

export function RecentThoughts({ thoughts }: { thoughts: DashboardData["recentThoughts"] }) {
  return (
    <Card className="h-full">
      <CardHeader className="flex-row items-start justify-between gap-2 space-y-0">
        <div className="space-y-1.5">
          <CardTitle>Recent thoughts</CardTitle>
          <CardDescription>The last things you took to the lab.</CardDescription>
        </div>
        {thoughts.length > 0 ? (
          <Link href={ROUTES.thoughts} className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "shrink-0")}>
            View all
          </Link>
        ) : null}
      </CardHeader>
      <CardContent>
        {thoughts.length === 0 ? (
          <div className="flex flex-col items-start gap-4 rounded-xl border border-dashed p-5">
            <p className="text-sm text-muted-foreground">Nothing here yet. Your most recent thoughts will show up here.</p>
            <Link href={ROUTES.newThought} className={cn(buttonVariants({ size: "sm" }))}>
              <FlaskConical aria-hidden="true" />
              Analyse a thought
            </Link>
          </div>
        ) : (
          // A list of stacked rows instead of a table, so it reads well at every width.
          <ul className="divide-y">
            {thoughts.map((thought) => (
              <li
                key={thought.id}
                className="relative flex flex-col gap-2 py-3.5 first:pt-0 last:pb-0 sm:flex-row sm:items-center sm:justify-between sm:gap-4"
              >
                <div className="min-w-0">
                  <p className="break-anywhere font-medium">
                    <Link
                      href={thoughtRoute(thought.id)}
                      className="rounded-sm outline-none after:absolute after:inset-0 focus-visible:underline"
                    >
                      {thought.title}
                    </Link>
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {thought.category}, {formatRelativeDate(thought.createdAt)}
                  </p>
                </div>
                <TrafficLightBadge value={thought.trafficLight} />
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
