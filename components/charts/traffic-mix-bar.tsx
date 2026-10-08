import { TRAFFIC_LIGHTS } from "@/lib/constants/thoughts";
import { cn } from "@/lib/utils";
import type { TrafficLight } from "@/types";

/** One stacked bar showing how recent entries split across the three traffic-light states. */
export function TrafficMixBar({ counts }: { counts: Record<TrafficLight, number> }) {
  const total = counts.green + counts.yellow + counts.red;
  const spoken = TRAFFIC_LIGHTS.map((light) => `${light.label}: ${counts[light.value]}`).join(", ");

  if (total === 0) {
    return <p className="text-sm text-muted-foreground">No entries in this period yet.</p>;
  }

  return (
    <div className="space-y-4">
      <div role="img" aria-label={`Traffic light mix. ${spoken}.`} className="flex h-4 w-full overflow-hidden rounded-full bg-muted">
        {TRAFFIC_LIGHTS.map((light) =>
          counts[light.value] > 0 ? (
            <span
              key={light.value}
              aria-hidden="true"
              className={cn("h-full transition-[width] duration-700", light.dot)}
              style={{ width: `${(counts[light.value] / total) * 100}%` }}
            />
          ) : null,
        )}
      </div>
      <ul className="grid gap-2 text-sm">
        {TRAFFIC_LIGHTS.map((light) => (
          <li key={light.value} className="flex items-center justify-between gap-3">
            <span className="flex items-center gap-2">
              <span aria-hidden="true" className={cn("h-2.5 w-2.5 rounded-full", light.dot)} />
              {light.label}
            </span>
            <span className="tabular-nums text-muted-foreground">
              {counts[light.value]} ({Math.round((counts[light.value] / total) * 100)}%)
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
