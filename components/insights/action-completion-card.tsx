import type { ActionCompletion } from "@/lib/insights/queries";

export function ActionCompletionCard({ data }: { data: ActionCompletion }) {
  if (data.total === 0) {
    return <p className="text-sm text-muted-foreground">No next actions were written in this period.</p>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-baseline gap-3">
        <p className="font-display text-3xl font-semibold tabular-nums">{data.rate}%</p>
        <p className="text-sm text-muted-foreground">
          {data.completed} of {data.total} {data.total === 1 ? "action" : "actions"} done
        </p>
      </div>

      <div
        className="h-2.5 w-full overflow-hidden rounded-full bg-muted"
        role="img"
        aria-label={`${data.completed} of ${data.total} actions completed`}
      >
        <div className="h-full rounded-full bg-success transition-[width] duration-700" style={{ width: `${data.rate}%` }} />
      </div>

      {data.overdue > 0 ? (
        <p className="text-sm text-muted-foreground">
          {data.overdue} {data.overdue === 1 ? "action is" : "actions are"} past their due date. A step that keeps
          slipping is often too big rather than forgotten.
        </p>
      ) : null}
    </div>
  );
}
