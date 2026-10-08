import { cn } from "@/lib/utils";

export interface BarDatum {
  label: string;
  value: number;
}

interface BarChartProps {
  data: readonly BarDatum[];
  /** Read out by screen readers in place of the picture, for example "Thoughts per week". */
  ariaLabel: string;
  /** Unit for the spoken summary, singular and plural. */
  unit?: { one: string; many: string };
  height?: number;
  /** Show every n-th x label, so long series (13 weeks) stay readable on a phone. */
  labelStep?: number;
  className?: string;
}

/**
 * A small column chart in plain HTML and CSS: sharp at every width, no chart
 * library to download, and text that scales with the page. The picture is
 * hidden from assistive tech and replaced by one sentence that lists the values.
 */
export function BarChart({ data, ariaLabel, unit = { one: "entry", many: "entries" }, height = 144, labelStep = 1, className }: BarChartProps) {
  const max = Math.max(1, ...data.map((item) => item.value));
  const spoken = data
    .map((item) => `${item.label}: ${item.value} ${item.value === 1 ? unit.one : unit.many}`)
    .join(". ");

  return (
    <div role="img" aria-label={`${ariaLabel}. ${spoken}.`} className={cn("w-full", className)}>
      <div aria-hidden="true" className="flex items-end gap-1.5 sm:gap-2.5" style={{ height }}>
        {data.map((item, index) => (
          <div key={`${item.label}-${index}`} className="flex h-full min-w-0 flex-1 flex-col justify-end gap-1.5">
            <span className="text-center text-xs tabular-nums text-muted-foreground">{item.value > 0 ? item.value : ""}</span>
            <div
              className={cn(
                "w-full rounded-t-lg transition-[height] duration-700 ease-out",
                item.value > 0 ? "bg-primary/80" : "bg-muted",
              )}
              style={{ height: `${Math.max(item.value > 0 ? 6 : 3, (item.value / max) * 100 * 0.78)}%` }}
            />
          </div>
        ))}
      </div>
      <div aria-hidden="true" className="mt-2 flex gap-1.5 sm:gap-2.5">
        {data.map((item, index) => (
          <span key={`${item.label}-${index}`} className="relative h-4 min-w-0 flex-1 text-[11px] text-muted-foreground">
            {index % labelStep === 0 ? (
              <span className="absolute left-1/2 top-0 -translate-x-1/2 whitespace-nowrap">{item.label}</span>
            ) : null}
          </span>
        ))}
      </div>
    </div>
  );
}

/** A tiny version for cards: no labels, just the shape over time. */
export function MiniBars({ values, ariaLabel, className }: { values: readonly number[]; ariaLabel: string; className?: string }) {
  const max = Math.max(1, ...values);

  return (
    <div role="img" aria-label={`${ariaLabel}: ${values.join(", ")}`} className={cn("flex h-8 items-end gap-0.5", className)}>
      {values.map((value, index) => (
        <span
          key={index}
          aria-hidden="true"
          className={cn("min-w-0 flex-1 rounded-sm", value > 0 ? "bg-primary/70" : "bg-muted")}
          style={{ height: `${Math.max(12, (value / max) * 100)}%` }}
        />
      ))}
    </div>
  );
}
