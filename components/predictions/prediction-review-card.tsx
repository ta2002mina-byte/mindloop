"use client";

import { CalendarCheck } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { FormAlert } from "@/components/forms/form-alert";
import { TextareaField } from "@/components/forms/textarea-field";
import { ConfidenceMeter } from "@/components/predictions/confidence-meter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PREDICTION_OUTCOMES } from "@/lib/constants/phase3";
import { thoughtRoute } from "@/lib/constants/routes";
import { reviewPrediction } from "@/lib/predictions/actions";
import { cn } from "@/lib/utils";
import type { PredictionOutcome, PredictionView } from "@/types";
import { formatDateOnly } from "@/utils/date";

const MAX_TEXT = 500;

/** The reality review: the prediction as written, four ways it may have gone, and a place for a few words. */
export function PredictionReviewCard({ prediction }: { prediction: PredictionView }) {
  const router = useRouter();
  const [rating, setRating] = useState<PredictionOutcome | "">("");
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!rating) {
      setError("Pick the answer that best matches how it went.");
      return;
    }

    setPending(true);
    setError(null);
    const result = await reviewPrediction({ id: prediction.id, outcomeRating: rating, outcome: note });
    setPending(false);

    if (!result.ok) {
      setError(result.message);
      return;
    }
    router.refresh();
  };

  const groupName = `outcome-${prediction.id}`;

  return (
    <Card className="border-signal/50">
      <CardHeader>
        <p className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-signal">
          <CalendarCheck className="h-4 w-4" aria-hidden="true" />
          Ready for review
        </p>
        <CardTitle className="text-base">You made this prediction earlier. What actually happened?</CardTitle>
        <CardDescription>
          About{" "}
          <Link href={thoughtRoute(prediction.thought_id)} className="break-anywhere text-primary underline-offset-4 hover:underline">
            {prediction.thoughtTitle}
          </Link>
          , expected {formatDateOnly(prediction.expected_date)}.
        </CardDescription>
      </CardHeader>

      <CardContent>
        <form onSubmit={(event) => void submit(event)} noValidate className="space-y-5">
          <div className="space-y-3 rounded-2xl border bg-muted/30 p-4">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Your prediction</p>
            <p className="break-anywhere leading-snug">{prediction.prediction_text}</p>
            <ConfidenceMeter confidence={prediction.confidence} />
          </div>

          {error ? <FormAlert variant="error">{error}</FormAlert> : null}

          <fieldset className="space-y-3">
            <legend className="text-sm font-medium">How did it turn out?</legend>
            <div className="grid gap-2 sm:grid-cols-2">
              {PREDICTION_OUTCOMES.map((option) => (
                <label key={option.value} className="relative block cursor-pointer">
                  <input
                    type="radio"
                    name={groupName}
                    value={option.value}
                    checked={rating === option.value}
                    onChange={() => setRating(option.value)}
                    className="peer sr-only"
                  />
                  <span
                    className={cn(
                      "flex items-start gap-3 rounded-xl border bg-card p-3.5 transition-colors hover:bg-accent/40",
                      "peer-focus-visible:ring-2 peer-focus-visible:ring-ring peer-focus-visible:ring-offset-2 peer-focus-visible:ring-offset-background",
                      rating === option.value && cn(option.border, option.tint),
                    )}
                  >
                    <span aria-hidden="true" className={cn("mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full", option.dot)} />
                    <span className="space-y-0.5">
                      <span className="block text-sm font-medium">{option.label}</span>
                      <span className="block text-xs text-muted-foreground">{option.summary}</span>
                    </span>
                  </span>
                </label>
              ))}
            </div>
          </fieldset>

          <TextareaField
            label="In a sentence or two, what happened? (optional)"
            value={note}
            rows={3}
            maxLength={MAX_TEXT}
            maxChars={MAX_TEXT}
            currentChars={note.length}
            onChange={(event) => setNote(event.target.value)}
          />

          <Button type="submit" loading={pending}>
            Record what happened
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
