import "server-only";

import { THOUGHTS_PAGE_SIZE } from "@/lib/constants/thoughts";
import { requireUser } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import type {
  ActionRow,
  ThoughtCategory,
  ThoughtDetail,
  ThoughtListItem,
  ThoughtStatus,
} from "@/types";

export interface ThoughtListFilters {
  search: string;
  category: ThoughtCategory | "all";
  status: ThoughtStatus | "all";
  page: number;
}

export interface ThoughtListResult {
  items: ThoughtListItem[];
  total: number;
  page: number;
  pageCount: number;
  /** True when the user has no thoughts at all, as opposed to none matching the filters. */
  isLibraryEmpty: boolean;
}

/**
 * PostgREST parses `or=(...)` as a comma-separated list, so characters with
 * meaning inside that expression are stripped rather than escaped.
 */
function sanitiseSearch(term: string): string {
  return term.replace(/[%,()\\*]/g, " ").trim().slice(0, 80);
}

export async function listThoughts(filters: ThoughtListFilters): Promise<ThoughtListResult> {
  const user = await requireUser();
  const supabase = await createClient();

  const page = Math.max(1, filters.page);
  const from = (page - 1) * THOUGHTS_PAGE_SIZE;
  const to = from + THOUGHTS_PAGE_SIZE - 1;

  // RLS already restricts rows to this user; the explicit eq keeps the index in play.
  let query = supabase
    .from("thoughts")
    .select("*", { count: "exact" })
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .range(from, to);

  if (filters.category !== "all") query = query.eq("category", filters.category);
  if (filters.status !== "all") query = query.eq("status", filters.status);

  const search = sanitiseSearch(filters.search);
  if (search) {
    query = query.or(`title.ilike.%${search}%,raw_text.ilike.%${search}%,trigger.ilike.%${search}%`);
  }

  const { data, error, count } = await query;
  if (error) {
    console.error("[thoughts] List failed:", error.message);
    throw new Error("Could not load your thoughts.");
  }

  const thoughts = data ?? [];
  const total = count ?? 0;

  // A second, narrow query instead of a nested select: the card only needs one
  // action per thought, and this keeps the payload (and the types) simple.
  const actionsByThought = await getNextActions(thoughts.map((thought) => thought.id));

  const hasFilters = Boolean(search) || filters.category !== "all" || filters.status !== "all";
  let isLibraryEmpty = total === 0 && !hasFilters;
  if (total === 0 && hasFilters) {
    const { count: libraryCount } = await supabase
      .from("thoughts")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id);
    isLibraryEmpty = (libraryCount ?? 0) === 0;
  }

  return {
    items: thoughts.map((thought) => ({ ...thought, nextAction: actionsByThought.get(thought.id) ?? null })),
    total,
    page,
    pageCount: Math.max(1, Math.ceil(total / THOUGHTS_PAGE_SIZE)),
    isLibraryEmpty,
  };
}

/** The most useful single action per thought: the oldest open one, else the newest done one. */
async function getNextActions(thoughtIds: string[]): Promise<Map<string, ActionRow>> {
  const result = new Map<string, ActionRow>();
  if (thoughtIds.length === 0) return result;

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("actions")
    .select("*")
    .in("thought_id", thoughtIds)
    .order("completed", { ascending: true })
    .order("created_at", { ascending: true });

  if (error) {
    // A missing action label is not worth failing the whole page for.
    console.error("[thoughts] Could not load actions for list:", error.message);
    return result;
  }

  for (const action of data ?? []) {
    if (!result.has(action.thought_id)) result.set(action.thought_id, action);
  }
  return result;
}

/** Full detail for one thought, or null when it does not exist for this user. */
export async function getThoughtDetail(id: string): Promise<ThoughtDetail | null> {
  const user = await requireUser();
  const supabase = await createClient();

  const { data: thought, error } = await supabase
    .from("thoughts")
    .select("*")
    .eq("id", id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (error) {
    console.error("[thoughts] Detail failed:", error.message);
    throw new Error("Could not load this thought.");
  }
  if (!thought) return null;

  const [facts, stories, emotions, controlItems, actions] = await Promise.all([
    supabase.from("thought_facts").select("*").eq("thought_id", id).order("created_at", { ascending: true }),
    supabase.from("thought_stories").select("*").eq("thought_id", id).order("created_at", { ascending: true }),
    supabase.from("emotions").select("*").eq("thought_id", id).order("intensity", { ascending: false }),
    supabase.from("control_items").select("*").eq("thought_id", id).order("created_at", { ascending: true }),
    supabase.from("actions").select("*").eq("thought_id", id).order("created_at", { ascending: true }),
  ]);

  const firstError =
    facts.error ?? stories.error ?? emotions.error ?? controlItems.error ?? actions.error ?? null;
  if (firstError) {
    console.error("[thoughts] Detail parts failed:", firstError.message);
    throw new Error("Could not load this thought.");
  }

  return {
    ...thought,
    facts: facts.data ?? [],
    stories: stories.data ?? [],
    emotions: emotions.data ?? [],
    controlItems: controlItems.data ?? [],
    actions: actions.data ?? [],
  };
}
