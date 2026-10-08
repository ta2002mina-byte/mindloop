import type { Metadata } from "next";
import Link from "next/link";
import { FlaskConical, Telescope } from "lucide-react";

import { FlowSteps } from "@/components/layout/flow-steps";
import { PageHeader } from "@/components/layout/page-header";
import { PageSection } from "@/components/layout/page-section";
import { OutcomeSummary } from "@/components/predictions/outcome-summary";
import { PredictionForm } from "@/components/predictions/prediction-form";
import { PredictionReviewCard } from "@/components/predictions/prediction-review-card";
import { ReviewedPredictionCard, WaitingPredictionCard } from "@/components/predictions/prediction-list-cards";
import { EmptyState } from "@/components/shared/empty-state";
import { buttonVariants } from "@/components/ui/button";
import { ROUTES } from "@/lib/constants/routes";
import { tallyOutcomes } from "@/lib/predictions/compare";
import { getPredictionOverview } from "@/lib/predictions/queries";
import { listThoughtOptions } from "@/lib/thoughts/options";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Predictions" };

const FLOW = ["Prediction", "Confidence", "Expected date", "Wait", "Reality review"] as const;

export default async function PredictionsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const [overview, thoughts, params] = await Promise.all([getPredictionOverview(), listThoughtOptions(), searchParams]);

  // /predictions?thought=<id> arrives from a thought's detail page; only ids the user owns are honoured.
  const requested = Array.isArray(params.thought) ? params.thought[0] : params.thought;
  const initialThoughtId = thoughts.some((thought) => thought.id === requested) ? requested : undefined;

  const tally = tallyOutcomes(overview.reviewed);

  return (
    <div className="space-y-8">
      <PageHeader
        className="mb-0 sm:mb-0"
        title="Predictions"
        description="Compare what you expected with what actually happened."
      />

      <FlowSteps label="How predictions work" steps={FLOW} />

      {thoughts.length === 0 ? (
        <EmptyState
          icon={FlaskConical}
          title="Start with a thought"
          description="A prediction belongs to one of your thoughts. Analyse a thought in the Thought Lab first, then come back to put a forecast on it."
          action={
            <Link href={ROUTES.newThought} className={cn(buttonVariants())}>
              Analyse a thought
            </Link>
          }
        />
      ) : (
        <div className="grid gap-6 lg:grid-cols-[minmax(0,26rem)_minmax(0,1fr)] lg:items-start">
          <PredictionForm thoughts={thoughts} initialThoughtId={initialThoughtId} />

          <div className="space-y-8">
            {overview.total === 0 ? (
              <EmptyState
                icon={Telescope}
                title="No predictions yet"
                description="Write down what you expect, and how sure you are. When the date arrives, this page asks what actually happened."
              />
            ) : null}

            {overview.ready.length > 0 ? (
              <PageSection title="Ready to review" description="The date has arrived. See how it went.">
                <div className="space-y-4">
                  {overview.ready.map((prediction) => (
                    <PredictionReviewCard key={prediction.id} prediction={prediction} />
                  ))}
                </div>
              </PageSection>
            ) : null}

            {overview.waiting.length > 0 ? (
              <PageSection title="Waiting" description="Nothing to do until the date. That is the point.">
                <ul className="grid gap-4 sm:grid-cols-2">
                  {overview.waiting.map((prediction) => (
                    <li key={prediction.id}>
                      <WaitingPredictionCard prediction={prediction} />
                    </li>
                  ))}
                </ul>
              </PageSection>
            ) : null}

            <OutcomeSummary tally={tally} />

            {overview.reviewed.length > 0 ? (
              <PageSection title="Reviewed" description="What you predicted, next to what happened.">
                <ul className="space-y-4">
                  {overview.reviewed.map((prediction) => (
                    <li key={prediction.id}>
                      <ReviewedPredictionCard prediction={prediction} />
                    </li>
                  ))}
                </ul>
              </PageSection>
            ) : null}
          </div>
        </div>
      )}

      <p className="text-xs text-muted-foreground">
        MindLoop Lab is a self-reflection tool and is not a substitute for professional mental health care.
      </p>
    </div>
  );
}
