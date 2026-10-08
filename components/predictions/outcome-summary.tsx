import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PREDICTION_OUTCOMES } from "@/lib/constants/phase3";
import type { OutcomeTally } from "@/lib/predictions/compare";
import { cn } from "@/lib/utils";

/** Across every reviewed prediction: how did reality compare? One bar, four labelled rows. */
export function OutcomeSummary({ tally }: { tally: OutcomeTally }) {
  if (tally.reviewed === 0) return null;

  const spoken = PREDICTION_OUTCOMES.map((option) => `${option.label}: ${tally.counts[option.value]}`).join(", ");
  const { highConfidence } = tally;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Prediction vs reality, so far</CardTitle>
        <CardDescription>
          {tally.reviewed === 1 ? "You have reviewed 1 prediction." : `You have reviewed ${tally.reviewed} predictions.`}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div role="img" aria-label={`How reviewed predictions turned out. ${spoken}.`} className="flex h-4 w-full overflow-hidden rounded-full bg-muted">
          {PREDICTION_OUTCOMES.map((option) =>
            tally.counts[option.value] > 0 ? (
              <span
                key={option.value}
                aria-hidden="true"
                className={cn("h-full transition-[width] duration-700", option.dot)}
                style={{ width: `${(tally.counts[option.value] / tally.reviewed) * 100}%` }}
              />
            ) : null,
          )}
        </div>

        <ul className="grid gap-2 text-sm sm:grid-cols-2">
          {PREDICTION_OUTCOMES.map((option) => (
            <li key={option.value} className="flex items-center justify-between gap-3">
              <span className="flex items-center gap-2">
                <span aria-hidden="true" className={cn("h-2.5 w-2.5 rounded-full", option.dot)} />
                {option.label}
              </span>
              <span className="tabular-nums text-muted-foreground">{tally.counts[option.value]}</span>
            </li>
          ))}
        </ul>

        {highConfidence.total > 0 ? (
          <p className="rounded-xl border bg-muted/30 px-3.5 py-2.5 text-sm text-muted-foreground">
            {highConfidence.total === 1
              ? "You were at least 70% sure about 1 prediction. "
              : `You were at least 70% sure about ${highConfidence.total} predictions. `}
            {highConfidence.worse + highConfidence.different === 0
              ? "None of them went worse than expected or turned out completely different."
              : `${highConfidence.worse} went worse than expected and ${highConfidence.different} turned out completely different.`}
          </p>
        ) : null}
      </CardContent>
    </Card>
  );
}
