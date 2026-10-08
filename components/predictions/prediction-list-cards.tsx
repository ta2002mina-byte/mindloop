import { Hourglass } from "lucide-react";
import Link from "next/link";

import { ConfidenceMeter } from "@/components/predictions/confidence-meter";
import { DeletePredictionButton } from "@/components/predictions/delete-prediction-button";
import { PredictionComparison } from "@/components/predictions/prediction-comparison";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { thoughtRoute } from "@/lib/constants/routes";
import type { PredictionView } from "@/types";
import { describeDaysUntil, formatDate, formatDateOnly } from "@/utils/date";

/** A prediction whose date has not arrived yet. */
export function WaitingPredictionCard({ prediction }: { prediction: PredictionView }) {
  return (
    <Card>
      <CardContent className="space-y-4 p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 space-y-1">
            <p className="break-anywhere font-medium leading-snug">{prediction.prediction_text}</p>
            <p className="text-sm text-muted-foreground">
              About{" "}
              <Link href={thoughtRoute(prediction.thought_id)} className="break-anywhere text-primary underline-offset-4 hover:underline">
                {prediction.thoughtTitle}
              </Link>
            </p>
          </div>
          <DeletePredictionButton id={prediction.id} />
        </div>

        <ConfidenceMeter confidence={prediction.confidence} />

        <Badge variant="outline">
          <Hourglass className="h-3 w-3" aria-hidden="true" />
          Review {describeDaysUntil(prediction.expected_date)}, {formatDateOnly(prediction.expected_date)}
        </Badge>
      </CardContent>
    </Card>
  );
}

/** A finished prediction with the full then-vs-reality comparison. */
export function ReviewedPredictionCard({ prediction }: { prediction: PredictionView }) {
  if (!prediction.outcome_rating) return null;

  return (
    <Card>
      <CardContent className="space-y-4 p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 space-y-1">
            <p className="text-sm text-muted-foreground">
              About{" "}
              <Link href={thoughtRoute(prediction.thought_id)} className="break-anywhere text-primary underline-offset-4 hover:underline">
                {prediction.thoughtTitle}
              </Link>
              {prediction.reviewed_at ? `, reviewed ${formatDate(prediction.reviewed_at)}` : null}
            </p>
          </div>
          <DeletePredictionButton id={prediction.id} />
        </div>

        <PredictionComparison
          predictionText={prediction.prediction_text}
          confidence={prediction.confidence}
          outcomeRating={prediction.outcome_rating}
          outcomeText={prediction.outcome}
        />
      </CardContent>
    </Card>
  );
}
