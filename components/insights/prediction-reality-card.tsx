import { PREDICTION_OUTCOMES } from "@/lib/constants/phase3";
import type { PredictionReality } from "@/lib/insights/queries";
import { cn } from "@/lib/utils";

/**
 * How the user's forecasts compared with what happened. Descriptive only: it
 * reports the four answers they chose themselves, and never scores them.
 */
export function PredictionRealityCard({ data }: { data: PredictionReality }) {
  if (data.reviewed === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        {data.waiting > 0
          ? `${data.waiting} ${data.waiting === 1 ? "prediction is" : "predictions are"} still waiting to be reviewed. The comparison appears once you review one.`
          : "No predictions in this period yet."}
      </p>
    );
  }

  return (
    <div className="space-y-4">
      <ul className="space-y-2.5">
        {PREDICTION_OUTCOMES.map((outcome) => {
          const count = data.outcomes[outcome.value];
          const share = Math.round((count / data.reviewed) * 100);

          return (
            <li key={outcome.value} className="space-y-1.5">
              <div className="flex items-baseline justify-between gap-3 text-sm">
                <span className="flex items-center gap-2">
                  <span aria-hidden="true" className={cn("h-2.5 w-2.5 rounded-full", outcome.dot)} />
                  {outcome.label}
                </span>
                <span className="shrink-0 tabular-nums text-muted-foreground">
                  {count} ({share}%)
                </span>
              </div>
              <div
                className="h-1.5 w-full overflow-hidden rounded-full bg-muted"
                role="img"
                aria-label={`${outcome.label}: ${count} of ${data.reviewed}`}
              >
                <div className={cn("h-full rounded-full", outcome.dot)} style={{ width: `${share}%` }} />
              </div>
            </li>
          );
        })}
      </ul>

      <dl className="grid gap-3 border-t pt-4 text-sm sm:grid-cols-2">
        <div>
          <dt className="text-muted-foreground">Average confidence when you wrote them</dt>
          <dd className="mt-0.5 font-medium tabular-nums">
            {data.averageConfidence === null ? "—" : `${data.averageConfidence}%`}
          </dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Average confidence on the ones that went better</dt>
          <dd className="mt-0.5 font-medium tabular-nums">
            {data.averageConfidenceWhenBetter === null ? "—" : `${data.averageConfidenceWhenBetter}%`}
          </dd>
        </div>
      </dl>
    </div>
  );
}
