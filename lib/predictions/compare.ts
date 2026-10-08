import { describeConfidence } from "@/lib/constants/phase3";
import type { PredictionOutcome } from "@/types";

/**
 * Words for the gap between what someone predicted and what happened.
 * Pure text logic, so it can be tested and changed without touching a component.
 * Every sentence describes ONE prediction; none of them says anything about the person.
 */
export function describeDifference(confidence: number, rating: PredictionOutcome): string {
  const sure = describeConfidence(confidence).toLowerCase();

  switch (rating) {
    case "better_than_expected":
      return `You were ${sure} about this, and it went better than the prediction.`;
    case "about_what_i_expected":
      return `You were ${sure} about this, and reality landed close to it.`;
    case "worse_than_expected":
      return `You were ${sure} about this, and it went worse than the prediction.`;
    case "completely_different":
      return `You were ${sure} about this, and something else happened instead. Some outcomes are hard to see coming.`;
  }
}

export interface OutcomeTally {
  reviewed: number;
  counts: Record<PredictionOutcome, number>;
  /** Predictions the user was at least 70% sure about, once reviewed. */
  highConfidence: { total: number; worse: number; different: number };
}

interface ReviewedLike {
  confidence: number;
  outcome_rating: PredictionOutcome | null;
}

/** Counts how the reviewed predictions landed. */
export function tallyOutcomes(reviewed: readonly ReviewedLike[]): OutcomeTally {
  const counts: Record<PredictionOutcome, number> = {
    better_than_expected: 0,
    about_what_i_expected: 0,
    worse_than_expected: 0,
    completely_different: 0,
  };
  const highConfidence = { total: 0, worse: 0, different: 0 };
  let total = 0;

  for (const item of reviewed) {
    if (!item.outcome_rating) continue;
    total += 1;
    counts[item.outcome_rating] += 1;

    if (item.confidence >= 70) {
      highConfidence.total += 1;
      if (item.outcome_rating === "worse_than_expected") highConfidence.worse += 1;
      if (item.outcome_rating === "completely_different") highConfidence.different += 1;
    }
  }

  return { reviewed: total, counts, highConfidence };
}
