import "server-only";

import { requireUser } from "@/lib/auth/session";
import { ROUTES, thoughtRoute } from "@/lib/constants/routes";
import { buildMindLoopSummary, type MindLoopSummary } from "@/lib/dashboard/mindloop";
import { getDetectorInputs } from "@/lib/patterns/queries";
import {
  buildTimeline,
  detectPatterns,
  splitWindows,
  type PatternSummary,
  type TimelineBucket,
} from "@/lib/pattern-detector";
import { createClient } from "@/lib/supabase/server";
import { detectTriggers } from "@/lib/trigger-detector";
import { todayUtc } from "@/utils/date";
import type { ActionPriority, ThoughtCategory, TrafficLight } from "@/types";

const PATTERN_WINDOW_DAYS = 30;
const WEEKS_SHOWN = 8;

export interface DashboardData {
  totalThoughts: number;
  thoughtsThisWeek: number;
  loopsDetected: number;
  predictionsPending: number;
  predictionsReady: number;
  predictionsReviewed: number;
  capsulesTotal: number;
  capsulesReady: number;
  actionsCompleted: number;
  weekly: TimelineBucket[];
  trafficMix: Record<TrafficLight, number>;
  recentThoughts: { id: string; title: string; category: ThoughtCategory; trafficLight: TrafficLight; createdAt: string }[];
  topPatterns: PatternSummary[];
  patternWindowDays: number;
  patternEntryCount: number;
  todayAction: { title: string; priority: ActionPriority; dueDate: string | null; thoughtId: string; thoughtTitle: string } | null;
  mindLoop: MindLoopSummary;
}

type CountResult = PromiseLike<{ count: number | null; error: { message: string } | null }>;

/** A missing number should never take the whole dashboard down. */
async function countOf(label: string, query: CountResult): Promise<number> {
  const { count, error } = await query;
  if (error) {
    console.error(`[dashboard] Count failed (${label}):`, error.message);
    return 0;
  }
  return count ?? 0;
}

/**
 * Everything the dashboard shows, from real rows. Counts use `head: true`, so
 * Postgres returns a number and no rows. The only free text read is the recent
 * entries the detector needs, and it stays on the server.
 */
export async function getDashboardData(): Promise<DashboardData> {
  const user = await requireUser();
  const supabase = await createClient();

  const now = new Date();
  const today = todayUtc();
  const weekAgo = new Date(now.getTime() - 7 * 86_400_000).toISOString();

  const head = { count: "exact", head: true } as const;

  const [
    inputs,
    totalThoughts,
    thoughtsThisWeek,
    predictionsPending,
    predictionsReady,
    predictionsReviewed,
    capsulesTotal,
    capsulesReady,
    actionsCompleted,
    recent,
    nextAction,
  ] = await Promise.all([
    getDetectorInputs(PATTERN_WINDOW_DAYS),
    countOf("thoughts", supabase.from("thoughts").select("id", head).eq("user_id", user.id)),
    countOf("thoughts this week", supabase.from("thoughts").select("id", head).eq("user_id", user.id).gte("created_at", weekAgo)),
    countOf("predictions pending", supabase.from("predictions").select("id", head).eq("user_id", user.id).is("reviewed_at", null)),
    countOf(
      "predictions ready",
      supabase.from("predictions").select("id", head).eq("user_id", user.id).is("reviewed_at", null).lte("expected_date", today),
    ),
    countOf("predictions reviewed", supabase.from("predictions").select("id", head).eq("user_id", user.id).not("reviewed_at", "is", null)),
    countOf("capsules", supabase.from("worry_capsules").select("id", head).eq("user_id", user.id)),
    countOf(
      "capsules ready",
      supabase.from("worry_capsules").select("id", head).eq("user_id", user.id).is("reopened_at", null).lte("reopen_date", today),
    ),
    countOf("actions completed", supabase.from("actions").select("id", head).eq("user_id", user.id).eq("completed", true)),
    supabase
      .from("thoughts")
      .select("id, title, category, trigger, traffic_light, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(5),
    supabase
      .from("actions")
      .select("thought_id, title, priority, due_date")
      .eq("user_id", user.id)
      .eq("completed", false)
      .order("due_date", { ascending: true, nullsFirst: false })
      .order("created_at", { ascending: true })
      .limit(1)
      .maybeSingle(),
  ]);

  if (recent.error) {
    console.error("[dashboard] Recent thoughts failed:", recent.error.message);
    throw new Error("Could not load your dashboard.");
  }
  if (nextAction.error) console.error("[dashboard] Next action failed:", nextAction.error.message);

  // Detection runs on the server; only its summaries go to the page.
  const options = { windowDays: PATTERN_WINDOW_DAYS, now };
  const patterns = detectPatterns(inputs, options);
  const triggers = detectTriggers(inputs, patterns.thoughtPatterns, options);
  const { current } = splitWindows(inputs, options);

  const trafficMix: Record<TrafficLight, number> = { green: 0, yellow: 0, red: 0 };
  for (const thought of current) trafficMix[thought.trafficLight] += 1;

  const recentRows = recent.data ?? [];

  let todayAction: DashboardData["todayAction"] = null;
  if (nextAction.data) {
    const { data: parent } = await supabase
      .from("thoughts")
      .select("title")
      .eq("id", nextAction.data.thought_id)
      .eq("user_id", user.id)
      .maybeSingle();
    todayAction = {
      title: nextAction.data.title,
      priority: nextAction.data.priority,
      dueDate: nextAction.data.due_date,
      thoughtId: nextAction.data.thought_id,
      thoughtTitle: parent?.title ?? "A thought",
    };
  }

  const mindLoop = buildMindLoopSummary({
    patterns,
    triggers,
    recentThoughts: recentRows.map((row) => ({
      id: row.id,
      title: row.title,
      trafficLight: row.traffic_light,
      trigger: row.trigger,
    })),
    todayAction: todayAction
      ? { title: todayAction.title, thoughtId: todayAction.thoughtId, priority: todayAction.priority }
      : null,
    thoughtHref: thoughtRoute,
    patternsHref: ROUTES.patterns,
  });

  return {
    totalThoughts,
    thoughtsThisWeek,
    loopsDetected: patterns.loops.count,
    predictionsPending,
    predictionsReady,
    predictionsReviewed,
    capsulesTotal,
    capsulesReady,
    actionsCompleted,
    weekly: buildTimeline(
      inputs.map((thought) => thought.createdAt),
      WEEKS_SHOWN,
      now,
    ),
    trafficMix,
    recentThoughts: recentRows.map((row) => ({
      id: row.id,
      title: row.title,
      category: row.category,
      trafficLight: row.traffic_light,
      createdAt: row.created_at,
    })),
    topPatterns: patterns.patterns.slice(0, 3),
    patternWindowDays: PATTERN_WINDOW_DAYS,
    patternEntryCount: patterns.totalThoughts,
    todayAction,
    mindLoop,
  };
}
