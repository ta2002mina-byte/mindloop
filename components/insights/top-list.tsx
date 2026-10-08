import { cn } from "@/lib/utils";

export interface TopListEntry {
  key: string;
  label: string;
  count: number;
  /** Optional second line: the words behind a match, or a neutral description. */
  detail?: string;
}

/**
 * A compact "what came up most" list with a share bar per row. Shared by the
 * trigger and pattern sections so both read the same way.
 */
export function TopList({
  entries,
  total,
  emptyText,
  unit = { one: "entry", many: "entries" },
}: {
  entries: readonly TopListEntry[];
  /** Denominator for the share bar: entries in the window. */
  total: number;
  emptyText: string;
  unit?: { one: string; many: string };
}) {
  if (entries.length === 0) {
    return <p className="text-sm text-muted-foreground">{emptyText}</p>;
  }

  const max = Math.max(1, ...entries.map((entry) => entry.count));

  return (
    <ul className="space-y-3.5">
      {entries.map((entry) => (
        <li key={entry.key} className="space-y-1.5">
          <div className="flex items-baseline justify-between gap-3">
            <p className="break-anywhere text-sm font-medium">{entry.label}</p>
            <p className="shrink-0 text-sm tabular-nums text-muted-foreground">
              {entry.count} {entry.count === 1 ? unit.one : unit.many}
              {total > 0 ? ` (${Math.round((entry.count / total) * 100)}%)` : ""}
            </p>
          </div>
          <div
            className="h-1.5 w-full overflow-hidden rounded-full bg-muted"
            role="img"
            aria-label={`${entry.label}: ${entry.count} of ${total}`}
          >
            <div
              className={cn("h-full rounded-full bg-primary/70 transition-[width] duration-700")}
              style={{ width: `${Math.max(4, (entry.count / max) * 100)}%` }}
            />
          </div>
          {entry.detail ? <p className="break-anywhere text-xs text-muted-foreground">{entry.detail}</p> : null}
        </li>
      ))}
    </ul>
  );
}
