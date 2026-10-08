import type { PredictionOutcome } from "@/types";

/* Predictions --------------------------------------------------------------- */

export interface PredictionOutcomeMeta {
  value: PredictionOutcome;
  label: string;
  /** Where the marker sits on the four-step comparison scale. */
  position: number;
  /** One neutral line; these describe what happened, not what it says about the person. */
  summary: string;
  dot: string;
  text: string;
  tint: string;
  border: string;
}

export const PREDICTION_OUTCOMES: readonly PredictionOutcomeMeta[] = [
  {
    value: "better_than_expected",
    label: "Better than expected",
    position: 0,
    summary: "Things went better than the prediction.",
    dot: "bg-emerald-500",
    text: "text-emerald-700 dark:text-emerald-300",
    tint: "bg-emerald-500/10",
    border: "border-emerald-500/50",
  },
  {
    value: "about_what_i_expected",
    label: "About what I expected",
    position: 1,
    summary: "Reality landed close to the prediction.",
    dot: "bg-sky-500",
    text: "text-sky-700 dark:text-sky-300",
    tint: "bg-sky-500/10",
    border: "border-sky-500/50",
  },
  {
    value: "worse_than_expected",
    label: "Worse than expected",
    position: 2,
    summary: "Things went worse than the prediction.",
    dot: "bg-amber-500",
    text: "text-amber-700 dark:text-amber-300",
    tint: "bg-amber-500/10",
    border: "border-amber-500/50",
  },
  {
    value: "completely_different",
    label: "Completely different",
    position: 3,
    summary: "Something other than the prediction happened.",
    dot: "bg-violet-500",
    text: "text-violet-700 dark:text-violet-300",
    tint: "bg-violet-500/10",
    border: "border-violet-500/50",
  },
];

export const PREDICTION_OUTCOME_MAP: Record<PredictionOutcome, PredictionOutcomeMeta> = {
  better_than_expected: PREDICTION_OUTCOMES[0]!,
  about_what_i_expected: PREDICTION_OUTCOMES[1]!,
  worse_than_expected: PREDICTION_OUTCOMES[2]!,
  completely_different: PREDICTION_OUTCOMES[3]!,
};

export function isPredictionOutcome(value: string): value is PredictionOutcome {
  return value in PREDICTION_OUTCOME_MAP;
}

/** Plain-language anchors for the 0–100% confidence slider. */
export function describeConfidence(confidence: number): string {
  if (confidence < 20) return "Very unsure";
  if (confidence < 45) return "Unsure";
  if (confidence < 65) return "Toss-up";
  if (confidence < 85) return "Fairly sure";
  return "Almost certain";
}

/* Worry capsules ------------------------------------------------------------ */

export type ReopenPreset = "tomorrow" | "three_days" | "seven_days" | "custom";

export interface ReopenPresetMeta {
  value: ReopenPreset;
  label: string;
  /** Days from today; null for the custom date. */
  days: number | null;
}

export const REOPEN_PRESETS: readonly ReopenPresetMeta[] = [
  { value: "tomorrow", label: "Tomorrow", days: 1 },
  { value: "three_days", label: "3 days", days: 3 },
  { value: "seven_days", label: "7 days", days: 7 },
  { value: "custom", label: "Custom", days: null },
];

export function isReopenPreset(value: string): value is ReopenPreset {
  return REOPEN_PRESETS.some((preset) => preset.value === value);
}

export const MAX_CAPSULE_DAYS = 365;
