import "server-only";

import { requireUser } from "@/lib/auth/session";
import { normaliseTrigger, startOfUtcDayMs, type DetectorThought } from "@/lib/pattern-detector";
import { createClient } from "@/lib/supabase/server";

const MS_PER_DAY = 86_400_000;

/** Hard ceiling so a very active account can never make one page enormous. */
const MAX_THOUGHTS = 400;

/** PostgREST puts `in (...)` in the URL, so ids are fetched in small groups. */
const ID_CHUNK = 100;

function chunk<T>(items: readonly T[], size: number): T[][] {
  const groups: T[][] = [];
  for (let index = 0; index < items.length; index += size) groups.push(items.slice(index, index + size));
  return groups;
}

/**
 * Flattens the user's recent entries into the shape the detectors need.
 *
 * PRIVACY: the raw thought text and stories are read here, on the server, only
 * to run the detector. What reaches the browser is the detector's output
 * (counts, labels, titles) and never the text itself. Only columns the
 * detector uses are selected, and only for the window that is needed.
 *
 * `windowDays` is the "recent" window; twice that is fetched so trends can be
 * compared with the period before.
 */
export async function getDetectorInputs(windowDays: number): Promise<DetectorThought[]> {
  const user = await requireUser();
  const supabase = await createClient();

  const since = new Date(startOfUtcDayMs(new Date()) - windowDays * 2 * MS_PER_DAY).toISOString();

  const { data: thoughts, error } = await supabase
    .from("thoughts")
    .select("id, title, raw_text, category, trigger, traffic_light, created_at")
    .eq("user_id", user.id)
    .gte("created_at", since)
    .order("created_at", { ascending: false })
    .limit(MAX_THOUGHTS);

  if (error) {
    console.error("[patterns] Could not load thoughts:", error.message);
    throw new Error("Could not load your entries.");
  }

  const rows = thoughts ?? [];
  if (rows.length === 0) return [];

  const storyResults = await Promise.all(
    chunk(
      rows.map((row) => row.id),
      ID_CHUNK,
    ).map((ids) => supabase.from("thought_stories").select("thought_id, content").in("thought_id", ids)),
  );

  const storiesByThought = new Map<string, string[]>();
  for (const result of storyResults) {
    if (result.error) {
      // Stories sharpen the detection but are not essential. Carry on without them.
      console.error("[patterns] Could not load stories:", result.error.message);
      continue;
    }
    for (const story of result.data ?? []) {
      const list = storiesByThought.get(story.thought_id) ?? [];
      list.push(story.content);
      storiesByThought.set(story.thought_id, list);
    }
  }

  return rows.map((row) => ({
    id: row.id,
    title: row.title,
    category: row.category,
    trigger: row.trigger,
    trafficLight: row.traffic_light,
    createdAt: row.created_at,
    text: [row.title, row.raw_text, ...(storiesByThought.get(row.id) ?? [])].join(". "),
  }));
}

/**
 * How many OTHER entries carry the same trigger, for the loop map.
 * Compares with the same normalisation the detector uses, so this number and
 * the Patterns page always agree.
 */
export async function countSameTrigger(thoughtId: string, trigger: string | null): Promise<number> {
  const key = normaliseTrigger(trigger);
  if (!key) return 0;

  const user = await requireUser();
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("thoughts")
    .select("id, trigger")
    .eq("user_id", user.id)
    .neq("id", thoughtId)
    .not("trigger", "is", null)
    .limit(MAX_THOUGHTS);

  if (error) {
    // A missing count is not worth failing the whole detail page.
    console.error("[patterns] Could not count repeated triggers:", error.message);
    return 0;
  }

  return (data ?? []).filter((row) => normaliseTrigger(row.trigger) === key).length;
}
