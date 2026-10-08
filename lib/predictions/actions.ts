"use server";

import { revalidatePath } from "next/cache";

import { requireUser } from "@/lib/auth/session";
import { ROUTES, thoughtRoute } from "@/lib/constants/routes";
import { createClient } from "@/lib/supabase/server";
import { createPredictionSchema, reviewPredictionSchema } from "@/lib/validations/prediction";
import { addDaysUtc, todayUtc } from "@/utils/date";
import type { ActionResult } from "@/types";

const GENERIC_ERROR = "We couldn't save that. Please try again.";

function firstIssueMessage(issues: { message: string }[]): string {
  return issues[0]?.message ?? "Some details are missing.";
}

function revalidatePredictions(thoughtId?: string) {
  revalidatePath(ROUTES.predictions);
  revalidatePath(ROUTES.dashboard);
  revalidatePath(ROUTES.patterns);
  if (thoughtId) revalidatePath(thoughtRoute(thoughtId));
}

interface CreatePredictionPayload {
  thoughtId: string;
  predictionText: string;
  confidence: number;
  expectedDate: string;
}

export async function createPrediction(payload: CreatePredictionPayload): Promise<ActionResult<{ id: string }>> {
  const user = await requireUser();
  const parsed = createPredictionSchema.safeParse(payload);
  if (!parsed.success) return { ok: false, message: firstIssueMessage(parsed.error.issues) };

  const values = parsed.data;

  // One day of slack: a person a few time zones west of UTC can still be on
  // "today" here while the server has already moved on.
  if (values.expectedDate < addDaysUtc(todayUtc(), -1)) {
    return { ok: false, message: "Pick today or a day in the future, so there is something to wait for." };
  }

  const supabase = await createClient();

  // RLS also enforces this; the explicit check gives a friendlier message.
  const { data: thought, error: thoughtError } = await supabase
    .from("thoughts")
    .select("id")
    .eq("id", values.thoughtId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (thoughtError) {
    console.error("[predictions] Thought lookup failed:", thoughtError.message);
    return { ok: false, message: GENERIC_ERROR };
  }
  if (!thought) return { ok: false, message: "We couldn't find that thought. It may have been deleted." };

  const { data, error } = await supabase
    .from("predictions")
    .insert({
      user_id: user.id,
      thought_id: values.thoughtId,
      prediction_text: values.predictionText,
      confidence: values.confidence,
      expected_date: values.expectedDate,
    })
    .select("id")
    .single();

  if (error || !data) {
    console.error("[predictions] Create failed:", error?.message);
    return { ok: false, message: GENERIC_ERROR };
  }

  revalidatePredictions(values.thoughtId);
  return { ok: true, data: { id: data.id } };
}

interface ReviewPredictionPayload {
  id: string;
  outcomeRating: string;
  outcome: string;
}

/** Records what actually happened. A prediction can only be reviewed once. */
export async function reviewPrediction(payload: ReviewPredictionPayload): Promise<ActionResult> {
  const user = await requireUser();
  const parsed = reviewPredictionSchema.safeParse(payload);
  if (!parsed.success) return { ok: false, message: firstIssueMessage(parsed.error.issues) };

  const values = parsed.data;
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("predictions")
    .update({
      outcome_rating: values.outcomeRating,
      outcome: values.outcome || null,
      reviewed_at: new Date().toISOString(),
    })
    .eq("id", values.id)
    .eq("user_id", user.id)
    .is("reviewed_at", null)
    .select("thought_id")
    .maybeSingle();

  if (error) {
    console.error("[predictions] Review failed:", error.message);
    return { ok: false, message: GENERIC_ERROR };
  }
  if (!data) return { ok: false, message: "This prediction was already reviewed, or no longer exists." };

  revalidatePredictions(data.thought_id);
  return { ok: true, data: undefined };
}

export async function deletePrediction(id: string): Promise<ActionResult> {
  const user = await requireUser();
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("predictions")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id)
    .select("thought_id")
    .maybeSingle();

  if (error) {
    console.error("[predictions] Delete failed:", error.message);
    return { ok: false, message: "We couldn't delete that. Please try again." };
  }

  revalidatePredictions(data?.thought_id);
  return { ok: true, data: undefined };
}
