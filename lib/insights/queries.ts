import "server-only";

import { requireUser } from "@/lib/auth/session";
import type { InsightRange } from "@/lib/insights/range";
import { weekStartOf } from "@/lib/insights/range";
import {
  buildTimeline,
  detectPatterns,
  startOfUtcDayMs,
  weeksForWindow,
  type PatternSummary,
  type TimelineBucket,
} from "@/lib/pattern-detector";
import { getDetectorInputs } from "@/lib/patterns/queries";
import { detectTriggers, type TriggerSummary } from "@/lib/trigger-detector";
import { createClient } from "@/lib/supabase/server";
import type { PredictionOutcome, ReflectionRow, ThoughtCategory, TrafficLight } from "@/types";

const MS_PER_DAY = 86_400_000;

/** How many rows one range can pull per table. Plenty for 90 days of real use. */
const MAX_ROWS = 500;

export interface WeeklyOverview {
  thoughts: number;
  /** Entries the user marked "Feels circular" in the window. */
  loops: number;
  actionsCompleted: number;
  predictionsReviewed: number;
  capsulesReviewed: number;
}

export interface ActionCompletion {
  total: number;
  completed: number;
  /** Whole percent, 0 when nothing was created in the window. */
  rate: number;
  /** Open actions whose due date has passed. */
  overdue: number;
}

export interface PredictionReality {
  reviewed: number;
  waiting: number;
  /** Counts per outcome rating, for the reviewed ones. */
  outcomes: Record<PredictionOutcome, number>;
  /** Mean confidence of the reviewed predictions, or null when there are none. */
  averageConfidence: number | null;
  /** Mean confidence of reviewed ones that turned out better than expected. */
  averageConfidenceWhenBetter: number | null;
}

export interface CapsuleReality {
  reopened: number;
  waiting: number;
  averageThen: number | null;
  averageNow: number | null;
}

export interface InsightsData {
  range: InsightRange;
  overview: WeeklyOverview;
  /** Entries per week across the window, for the bar chart. */
  timeline: TimelineBucket[];
  trafficMix: Record<TrafficLight, number>;
  categories: { category: ThoughtCategory; count: number }[];
  triggers: TriggerSummary[];
  patterns: PatternSummary[];
  actions: ActionCompletion;
  predictions: PredictionReality;
  capsules: CapsuleReality;
  /** This week's reflection, if it has been written. */
  currentReflection: ReflectionRow | null;
  /** Earlier reflections, newest first. */
  pastReflections: ReflectionRow[];
  currentWeekStart: string;
}

const EMPTY_OUTCOMES: Record<PredictionOutcome, number> = {
  better_than_expected: 0,
  about_what_i_expected: 0,
  worse_than_expected: 0,
  completely_different: 0,
};

function average(values: readonly number[]): number | null {
  if (values.length === 0) return null;
  return Math.round(values.reduce((total, value) => total + value, 0) / values.length);
}

/**
 * Everything the Insights page and the printable report need, for one window.
 *
 * Each table is queried separately and filtered by user_id as well as by RLS,
 * then the numbers are worked out in TypeScript. That keeps the SQL boring and
 * the aggregation testable, at the cost of pulling a few hundred narrow rows.
 */
export async function getInsights(range: InsightRange): Promise<InsightsData> {
  const user = await requireUser();
  const supabase = await createClient();

  const now = new Date();
  const since = new Date(startOfUtcDayMs(now) - (range - 1) * MS_PER_DAY).toISOString();
  const currentWeekStart = weekStartOf(now);

  const [thoughtRows, actionRows, predictionRows, capsuleRows, reflectionRows, detectorInputs] = await Promise.all([
    supabase
      .from("thoughts")
      .select("id, category, traffic_light, created_at")
      .eq("user_id", user.id)
      .gte("created_at", since)
      .limit(MAX_ROWS),
    supabase
      .from("actions")
      .select("id, completed, completed_at, due_date, created_at")
      .eq("user_id", user.id)
      .gte("created_at", since)
      .limit(MAX_ROWS),
    supabase
      .from("predictions")
      .select("id, confidence, outcome_rating, reviewed_at, expected_date, created_at")
      .eq("user_id", user.id)
      .gte("created_at", since)
      .limit(MAX_ROWS),
    supabase
      .from("worry_capsules")
      .select("id, worry_intensity, current_intensity, reopened_at, reopen_date, created_at")
      .eq("user_id", user.id)
      .gte("created_at", since)
      .limit(MAX_ROWS),
    supabase
      .from("reflections")
      .select("*")
      .eq("user_id", user.id)
      .order("week_start", { ascending: false })
      .limit(12),
    // Reuses the Patterns page loader, so triggers and patterns are computed the
    // same way in both places. Raw text is read on the server only.
    getDetectorInputs(range),
  ]);

  const firstError =
    thoughtRows.error ?? actionRows.error ?? predictionRows.error ?? capsuleRows.error ?? reflectionRows.error ?? null;
  if (firstError) {
    console.error("[insights] Could not load data:", firstError.message);
    throw new Error("Could not load your insights.");
  }

  const thoughts = thoughtRows.data ?? [];
  const actions = actionRows.data ?? [];
  const predictions = predictionRows.data ?? [];
  const capsules = capsuleRows.data ?? [];
  const reflections = reflectionRows.data ?? [];

  /* Thoughts ---------------------------------------------------------------- */
  const trafficMix: Record<TrafficLight, number> = { green: 0, yellow: 0, red: 0 };
  const categoryCounts = new Map<ThoughtCategory, number>();
  for (const thought of thoughts) {
    trafficMix[thought.traffic_light] += 1;
    categoryCounts.set(thought.category, (categoryCounts.get(thought.category) ?? 0) + 1);
  }

  const timeline = buildTimeline(
    thoughts.map((thought) => thought.created_at),
    weeksForWindow(range),
    now,
  );

  /* Actions ----------------------------------------------------------------- */
  const today = startOfUtcDayMs(now);
  const completed = actions.filter((action) => action.completed).length;
  const overdue = actions.filter(
    (action) => !action.completed && action.due_date !== null && Date.parse(`${action.due_date}T00:00:00Z`) < today,
  ).length;

  /* Predictions ------------------------------------------------------------- */
  const outcomes = { ...EMPTY_OUTCOMES };
  const reviewedConfidences: number[] = [];
  const betterConfidences: number[] = [];
  let reviewedPredictions = 0;

  for (const prediction of predictions) {
    if (!prediction.reviewed_at || !prediction.outcome_rating) continue;
    reviewedPredictions += 1;
    outcomes[prediction.outcome_rating] += 1;
    reviewedConfidences.push(prediction.confidence);
    if (prediction.outcome_rating === "better_than_expected") betterConfidences.push(prediction.confidence);
  }

  /* Patterns and triggers: computed once and shared ------------------------- */
  const patternReport = detectPatterns(detectorInputs, { windowDays: range, now });
  const triggerReport = detectTriggers(detectorInputs, patternReport.thoughtPatterns, { windowDays: range, now });

  /* Capsules ---------------------------------------------------------------- */
  const reopenedCapsules = capsules.filter((capsule) => capsule.reopened_at !== null);
  const thenValues = reopenedCapsules.map((capsule) => capsule.worry_intensity);
  const nowValues = reopenedCapsules
    .map((capsule) => capsule.current_intensity)
    .filter((value): value is number => value !== null);

  return {
    range,
    overview: {
      thoughts: thoughts.length,
      loops: trafficMix.red,
      actionsCompleted: completed,
      predictionsReviewed: reviewedPredictions,
      capsulesReviewed: reopenedCapsules.length,
    },
    timeline,
    trafficMix,
    categories: [...categoryCounts.entries()]
      .map(([category, count]) => ({ category, count }))
      .sort((a, b) => b.count - a.count || a.category.localeCompare(b.category)),
    // Recurring triggers first, then the broader contexts, capped for one page.
    triggers: [...triggerReport.recurring, ...triggerReport.contexts].slice(0, 5),
    patterns: patternReport.patterns.slice(0, 5),
    actions: {
      total: actions.length,
      completed,
      rate: actions.length === 0 ? 0 : Math.round((completed / actions.length) * 100),
      overdue,
    },
    predictions: {
      reviewed: reviewedPredictions,
      waiting: predictions.length - reviewedPredictions,
      outcomes,
      averageConfidence: average(reviewedConfidences),
      averageConfidenceWhenBetter: average(betterConfidences),
    },
    capsules: {
      reopened: reopenedCapsules.length,
      waiting: capsules.length - reopenedCapsules.length,
      averageThen: average(thenValues),
      averageNow: average(nowValues),
    },
    currentReflection: reflections.find((row) => row.week_start === currentWeekStart) ?? null,
    pastReflections: reflections.filter((row) => row.week_start !== currentWeekStart),
    currentWeekStart,
  };
}
