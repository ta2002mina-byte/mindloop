import "server-only";

import { requireUser } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { hasDateArrived } from "@/utils/date";
import type { CapsuleView } from "@/types";

export interface CapsuleOverview {
  ready: CapsuleView[];
  locked: CapsuleView[];
  reopened: CapsuleView[];
  total: number;
}

/**
 * The user's capsules, sorted by stage.
 *
 * THE LOCK IS ENFORCED HERE, on the server: for a locked capsule the original
 * thought text and the original intensity are never read into the response, so
 * they cannot be found in the page payload, the network tab or the React tree.
 * (The database trigger separately stops a locked capsule being reopened early.)
 */
export async function getCapsuleOverview(): Promise<CapsuleOverview> {
  const user = await requireUser();
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("worry_capsules")
    .select("*")
    .eq("user_id", user.id)
    .order("reopen_date", { ascending: true })
    .limit(300);

  if (error) {
    console.error("[capsules] List failed:", error.message);
    throw new Error("Could not load your capsules.");
  }

  const rows = data ?? [];
  const stageOf = (row: (typeof rows)[number]): CapsuleView["stage"] =>
    row.reopened_at ? "reopened" : hasDateArrived(row.reopen_date) ? "ready" : "locked";

  const allIds = [...new Set(rows.map((row) => row.thought_id))].slice(0, 100);
  const openIds = [...new Set(rows.filter((row) => stageOf(row) !== "locked").map((row) => row.thought_id))].slice(0, 100);

  const titles = new Map<string, string>();
  const texts = new Map<string, string>();

  if (allIds.length > 0) {
    const { data: thoughts, error: titleError } = await supabase.from("thoughts").select("id, title").in("id", allIds);
    if (titleError) console.error("[capsules] Could not load thought titles:", titleError.message);
    for (const thought of thoughts ?? []) titles.set(thought.id, thought.title);
  }

  if (openIds.length > 0) {
    const { data: thoughts, error: textError } = await supabase.from("thoughts").select("id, raw_text").in("id", openIds);
    if (textError) console.error("[capsules] Could not load thought text:", textError.message);
    for (const thought of thoughts ?? []) texts.set(thought.id, thought.raw_text);
  }

  const views: CapsuleView[] = rows.map((row) => {
    const stage = stageOf(row);
    const sealed = stage === "locked";
    return {
      id: row.id,
      thoughtId: row.thought_id,
      thoughtTitle: titles.get(row.thought_id) ?? "A thought",
      reopenDate: row.reopen_date,
      createdAt: row.created_at,
      stage,
      thoughtText: sealed ? null : (texts.get(row.thought_id) ?? null),
      worryIntensity: sealed ? null : row.worry_intensity,
      reopenedAt: row.reopened_at,
      currentIntensity: row.current_intensity,
      outcome: row.outcome,
      whatChanged: row.what_changed,
    };
  });

  return {
    ready: views.filter((view) => view.stage === "ready"),
    locked: views.filter((view) => view.stage === "locked"),
    reopened: views
      .filter((view) => view.stage === "reopened")
      .sort((a, b) => (b.reopenedAt ?? "").localeCompare(a.reopenedAt ?? "")),
    total: views.length,
  };
}
