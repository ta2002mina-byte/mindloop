"use server";

import { revalidatePath } from "next/cache";

import { requireUser } from "@/lib/auth/session";
import { ROUTES, thoughtRoute } from "@/lib/constants/routes";
import { createClient } from "@/lib/supabase/server";
import type { ThoughtDraft } from "@/lib/thoughts/draft";
import { thoughtDraftSchema, thoughtStatusSchema } from "@/lib/validations/thought";
import type { ActionResult, ThoughtStatus } from "@/types";

const GENERIC_ERROR = "We couldn't save that. Please try again.";

function firstIssueMessage(issues: { message: string }[]): string {
  return issues[0]?.message ?? "Some details are missing. Go back and check the steps.";
}

function revalidateThought(id?: string) {
  revalidatePath(ROUTES.thoughts);
  revalidatePath(ROUTES.dashboard);
  // Deleting or editing a thought changes what these pages are computed from.
  revalidatePath(ROUTES.patterns);
  revalidatePath(ROUTES.predictions);
  revalidatePath(ROUTES.worryCapsules);
  if (id) revalidatePath(thoughtRoute(id));
}

/** Rows for the child tables, derived from a validated draft. */
function childRows(thoughtId: string, draft: ReturnType<typeof thoughtDraftSchema.parse>) {
  return {
    facts: draft.facts.map((item) => ({ thought_id: thoughtId, content: item.content.trim() })),
    stories: draft.stories.map((item) => ({ thought_id: thoughtId, content: item.content.trim() })),
    emotions: draft.emotions.map((item) => ({
      thought_id: thoughtId,
      emotion: item.emotion.trim(),
      intensity: item.intensity,
    })),
    controlItems: draft.controlItems.map((item) => ({
      thought_id: thoughtId,
      content: item.content.trim(),
      control_type: item.controlType,
    })),
  };
}

/**
 * Inserts every child row for a thought. Returns the first error message, or null.
 * PostgREST has no multi-table transaction, so the callers below undo their own
 * work when this fails rather than leaving a half-saved thought behind.
 */
async function insertChildren(
  supabase: Awaited<ReturnType<typeof createClient>>,
  thoughtId: string,
  userId: string,
  draft: ReturnType<typeof thoughtDraftSchema.parse>,
): Promise<string | null> {
  const rows = childRows(thoughtId, draft);

  const results = await Promise.all([
    rows.facts.length ? supabase.from("thought_facts").insert(rows.facts) : null,
    rows.stories.length ? supabase.from("thought_stories").insert(rows.stories) : null,
    rows.emotions.length ? supabase.from("emotions").insert(rows.emotions) : null,
    rows.controlItems.length ? supabase.from("control_items").insert(rows.controlItems) : null,
  ]);

  for (const result of results) {
    if (result?.error) return result.error.message;
  }

  const actionTitle = draft.action.title.trim();
  if (actionTitle) {
    const { error } = await supabase.from("actions").insert({
      thought_id: thoughtId,
      user_id: userId,
      title: actionTitle,
      priority: draft.action.priority,
      due_date: draft.action.dueDate || null,
    });
    if (error) return error.message;
  }

  return null;
}

/** Creates a thought and everything attached to it. Returns the new id. */
export async function createThought(draft: ThoughtDraft): Promise<ActionResult<{ id: string }>> {
  const user = await requireUser();
  const parsed = thoughtDraftSchema.safeParse(draft);
  if (!parsed.success) {
    return { ok: false, message: firstIssueMessage(parsed.error.issues) };
  }

  const supabase = await createClient();
  const values = parsed.data;

  const { data: thought, error } = await supabase
    .from("thoughts")
    .insert({
      user_id: user.id,
      title: values.title.trim(),
      raw_text: values.rawText.trim(),
      category: values.category,
      trigger: values.trigger.trim() || null,
      traffic_light: values.trafficLight,
    })
    .select("id")
    .single();

  if (error || !thought) {
    console.error("[thoughts] Create failed:", error?.message);
    return { ok: false, message: GENERIC_ERROR };
  }

  const childError = await insertChildren(supabase, thought.id, user.id, values);
  if (childError) {
    console.error("[thoughts] Create children failed:", childError);
    // Undo the parent so the user never sees an empty half-saved thought.
    await supabase.from("thoughts").delete().eq("id", thought.id);
    return { ok: false, message: GENERIC_ERROR };
  }

  revalidateThought(thought.id);
  return { ok: true, data: { id: thought.id } };
}

/**
 * Replaces a thought's analysis with the edited draft.
 * The child rows are rewritten rather than diffed: they are small, unordered
 * lists, and a rewrite keeps the outcome predictable.
 */
export async function updateThought(id: string, draft: ThoughtDraft): Promise<ActionResult<{ id: string }>> {
  const user = await requireUser();
  const parsed = thoughtDraftSchema.safeParse(draft);
  if (!parsed.success) {
    return { ok: false, message: firstIssueMessage(parsed.error.issues) };
  }

  const supabase = await createClient();
  const values = parsed.data;

  const { data: updated, error } = await supabase
    .from("thoughts")
    .update({
      title: values.title.trim(),
      raw_text: values.rawText.trim(),
      category: values.category,
      trigger: values.trigger.trim() || null,
      traffic_light: values.trafficLight,
    })
    .eq("id", id)
    .eq("user_id", user.id)
    .select("id")
    .maybeSingle();

  if (error) {
    console.error("[thoughts] Update failed:", error.message);
    return { ok: false, message: GENERIC_ERROR };
  }
  if (!updated) {
    return { ok: false, message: "We couldn't find that thought. It may have been deleted." };
  }

  const cleared = await Promise.all([
    supabase.from("thought_facts").delete().eq("thought_id", id),
    supabase.from("thought_stories").delete().eq("thought_id", id),
    supabase.from("emotions").delete().eq("thought_id", id),
    supabase.from("control_items").delete().eq("thought_id", id),
    // Completed actions are history, so only the open one is replaced.
    supabase.from("actions").delete().eq("thought_id", id).eq("completed", false),
  ]);

  for (const result of cleared) {
    if (result.error) {
      console.error("[thoughts] Update clear failed:", result.error.message);
      return { ok: false, message: GENERIC_ERROR };
    }
  }

  const childError = await insertChildren(supabase, id, user.id, values);
  if (childError) {
    console.error("[thoughts] Update children failed:", childError);
    return { ok: false, message: "Some parts didn't save. Open the thought and check it before editing again." };
  }

  revalidateThought(id);
  return { ok: true, data: { id } };
}

export async function setThoughtStatus(id: string, status: ThoughtStatus): Promise<ActionResult> {
  const user = await requireUser();
  const parsed = thoughtStatusSchema.safeParse(status);
  if (!parsed.success) return { ok: false, message: GENERIC_ERROR };

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("thoughts")
    .update({ status: parsed.data })
    .eq("id", id)
    .eq("user_id", user.id)
    .select("id")
    .maybeSingle();

  if (error) {
    console.error("[thoughts] Status change failed:", error.message);
    return { ok: false, message: GENERIC_ERROR };
  }
  if (!data) return { ok: false, message: "We couldn't find that thought." };

  revalidateThought(id);
  return { ok: true, data: undefined };
}

export async function deleteThought(id: string): Promise<ActionResult> {
  const user = await requireUser();
  const supabase = await createClient();

  // Child rows go with it: every foreign key is ON DELETE CASCADE.
  const { error } = await supabase.from("thoughts").delete().eq("id", id).eq("user_id", user.id);
  if (error) {
    console.error("[thoughts] Delete failed:", error.message);
    return { ok: false, message: "We couldn't delete that. Please try again." };
  }

  revalidateThought(id);
  return { ok: true, data: undefined };
}

/** Ticks or unticks the next action. */
export async function setActionCompleted(actionId: string, completed: boolean): Promise<ActionResult> {
  const user = await requireUser();
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("actions")
    .update({ completed, completed_at: completed ? new Date().toISOString() : null })
    .eq("id", actionId)
    .eq("user_id", user.id)
    .select("thought_id")
    .maybeSingle();

  if (error) {
    console.error("[actions] Update failed:", error.message);
    return { ok: false, message: "We couldn't update that action. Please try again." };
  }
  if (!data) return { ok: false, message: "We couldn't find that action." };

  revalidateThought(data.thought_id);
  return { ok: true, data: undefined };
}
