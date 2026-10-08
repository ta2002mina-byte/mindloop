import { ConfidenceMeter } from "@/components/predictions/confidence-meter";
import { PREDICTION_OUTCOMES, PREDICTION_OUTCOME_MAP } from "@/lib/constants/phase3";
import { describeDifference } from "@/lib/predictions/compare";
import { cn } from "@/lib/utils";
import type { PredictionOutcome } from "@/types";

interface PredictionComparisonProps {
  predictionText: string;
  confidence: number;
  outcomeRating: PredictionOutcome;
  outcomeText: string | null;
}

/**
 * Prediction on the left, reality on the right, and the difference underneath
 * on a four-step scale. The marker never says "good" or "bad": four neutral
 * colours, each with a text label, so nothing relies on colour alone.
 */
export function PredictionComparison({ predictionText, confidence, outcomeRating, outcomeText }: PredictionComparisonProps) {
  const meta = PREDICTION_OUTCOME_MAP[outcomeRating];

  return (
    <div className="space-y-4">
      <div className="grid gap-3 md:grid-cols-2">
        <section aria-label="You predicted" className="space-y-3 rounded-2xl border bg-muted/30 p-4">
          <h4 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            You predicted
          </h4>
          <p className="break-anywhere leading-snug">{predictionText}</p>
          <ConfidenceMeter confidence={confidence} />
        </section>

        <section className={cn("space-y-3 rounded-2xl border p-4", meta.border, meta.tint)}>
          <h4 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">What actually happened</h4>
          <p className={cn("flex items-center gap-2 font-medium", meta.text)}>
            <span aria-hidden="true" className={cn("h-2.5 w-2.5 rounded-full", meta.dot)} />
            {meta.label}
          </p>
          {outcomeText ? (
            <p className="break-anywhere text-sm leading-relaxed">{outcomeText}</p>
          ) : (
            <p className="text-sm text-muted-foreground">No note added.</p>
          )}
        </section>
      </div>

      <div className="space-y-3 rounded-2xl border p-4">
        <h4 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">The difference</h4>

        <ol className="grid grid-cols-2 gap-2 sm:grid-cols-4" aria-label="How it compared with the prediction">
          {PREDICTION_OUTCOMES.map((option) => {
            const active = option.value === outcomeRating;
            return (
              <li
                key={option.value}
                aria-current={active ? "true" : undefined}
                className={cn(
                  "flex flex-col items-center gap-1.5 rounded-xl border px-2 py-2.5 text-center text-xs transition-colors",
                  active ? cn("font-medium", option.border, option.tint, option.text) : "border-dashed text-muted-foreground",
                )}
              >
                <span aria-hidden="true" className={cn("h-2.5 w-2.5 rounded-full", active ? option.dot : "bg-muted-foreground/30")} />
                {option.label}
              </li>
            );
          })}
        </ol>

        <p className="text-sm text-muted-foreground">{describeDifference(confidence, outcomeRating)}</p>
      </div>
    </div>
  );
}
