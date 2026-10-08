import "server-only";

import { requireUser } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { hasDateArrived } from "@/utils/date";
import type { PredictionView } from "@/types";

export interface PredictionOverview {
  ready: PredictionView[];
  waiting: PredictionView[];
  reviewed: PredictionView[];
  total: number;
}

/** Every prediction for this user, sorted into the three stages of the flow. */
export async function getPredictionOverview(): Promise<PredictionOverview> {
  const user = await requireUser();
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("predictions")
    .select("*")
    .eq("user_id", user.id)
    .order("expected_date", { ascending: true })
    .limit(300);

  if (error) {
    console.error("[predictions] List failed:", error.message);
    throw new Error("Could not load your predictions.");
  }

  const rows = data ?? [];
  const thoughtIds = [...new Set(rows.map((row) => row.thought_id))];
  const titles = new Map<string, string>();

  if (thoughtIds.length > 0) {
    const { data: thoughts, error: titleError } = await supabase
      .from("thoughts")
      .select("id, title")
      .in("id", thoughtIds.slice(0, 100));
    if (titleError) console.error("[predictions] Could not load thought titles:", titleError.message);
    for (const thought of thoughts ?? []) titles.set(thought.id, thought.title);
  }

  const views: PredictionView[] = rows.map((row) => ({
    ...row,
    thoughtTitle: titles.get(row.thought_id) ?? "A thought",
    stage: row.reviewed_at ? "reviewed" : hasDateArrived(row.expected_date) ? "ready" : "waiting",
  }));

  return {
    ready: views.filter((view) => view.stage === "ready"),
    waiting: views.filter((view) => view.stage === "waiting"),
    reviewed: views
      .filter((view) => view.stage === "reviewed")
      .sort((a, b) => (b.reviewed_at ?? "").localeCompare(a.reviewed_at ?? "")),
    total: views.length,
  };
}
