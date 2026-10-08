"use server";

import { revalidatePath } from "next/cache";

import { requireUser } from "@/lib/auth/session";
import { MAX_CAPSULE_DAYS, REOPEN_PRESETS } from "@/lib/constants/phase3";
import { ROUTES } from "@/lib/constants/routes";
import { createClient } from "@/lib/supabase/server";
import { createCapsuleSchema, reopenCapsuleSchema } from "@/lib/validations/capsule";
import { addDaysUtc, formatDateOnly, hasDateArrived, todayUtc } from "@/utils/date";
import type { ActionResult } from "@/types";

const GENERIC_ERROR = "We couldn't save that. Please try again.";

function firstIssueMessage(issues: { message: string }[]): string {
  return issues[0]?.message ?? "Some details are missing.";
}

function revalidateCapsules() {
  revalidatePath(ROUTES.worryCapsules);
  revalidatePath(ROUTES.dashboard);
}

interface CreateCapsulePayload {
  thoughtId: string;
  worryIntensity: number;
  preset: string;
  customDate: string;
}

/** Seals a thought until the chosen day. The date is worked out here, never trusted from the browser. */
export async function createCapsule(payload: CreateCapsulePayload): Promise<ActionResult<{ id: string; reopenDate: string }>> {
  const user = await requireUser();
  const parsed = createCapsuleSchema.safeParse(payload);
  if (!parsed.success) return { ok: false, message: firstIssueMessage(parsed.error.issues) };

  const values = parsed.data;
  const today = todayUtc();
  const preset = REOPEN_PRESETS.find((item) => item.value === values.preset);

  let reopenDate: string;
  if (preset?.days != null) {
    reopenDate = addDaysUtc(today, preset.days);
  } else {
    reopenDate = values.customDate;
    if (reopenDate < addDaysUtc(today, 1)) {
      return { ok: false, message: "Choose tomorrow or a later day. A capsule needs at least one night." };
    }
    if (reopenDate > addDaysUtc(today, MAX_CAPSULE_DAYS)) {
      return { ok: false, message: "Choose a day within the next year." };
    }
  }

  const supabase = await createClient();

  const { data: thought, error: thoughtError } = await supabase
    .from("thoughts")
    .select("id")
    .eq("id", values.thoughtId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (thoughtError) {
    console.error("[capsules] Thought lookup failed:", thoughtError.message);
    return { ok: false, message: GENERIC_ERROR };
  }
  if (!thought) return { ok: false, message: "We couldn't find that thought. It may have been deleted." };

  const { data, error } = await supabase
    .from("worry_capsules")
    .insert({
      user_id: user.id,
      thought_id: values.thoughtId,
      worry_intensity: values.worryIntensity,
      reopen_date: reopenDate,
    })
    .select("id, reopen_date")
    .single();

  if (error || !data) {
    console.error("[capsules] Create failed:", error?.message);
    return { ok: false, message: GENERIC_ERROR };
  }

  revalidateCapsules();
  return { ok: true, data: { id: data.id, reopenDate: data.reopen_date } };
}

interface ReopenCapsulePayload {
  id: string;
  currentIntensity: number;
  outcome: string;
  whatChanged: string;
}

/** Opens a capsule and records how things look now. Only possible from the reopen date on. */
export async function reopenCapsule(payload: ReopenCapsulePayload): Promise<ActionResult> {
  const user = await requireUser();
  const parsed = reopenCapsuleSchema.safeParse(payload);
  if (!parsed.success) return { ok: false, message: firstIssueMessage(parsed.error.issues) };

  const values = parsed.data;
  const supabase = await createClient();

  const { data: capsule, error: lookupError } = await supabase
    .from("worry_capsules")
    .select("id, reopen_date, reopened_at")
    .eq("id", values.id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (lookupError) {
    console.error("[capsules] Lookup failed:", lookupError.message);
    return { ok: false, message: GENERIC_ERROR };
  }
  if (!capsule) return { ok: false, message: "We couldn't find that capsule." };
  if (capsule.reopened_at) return { ok: false, message: "This capsule has already been opened." };
  if (!hasDateArrived(capsule.reopen_date)) {
    return { ok: false, message: `This capsule stays sealed until ${formatDateOnly(capsule.reopen_date)}.` };
  }

  const { data, error } = await supabase
    .from("worry_capsules")
    .update({
      reopened_at: new Date().toISOString(),
      current_intensity: values.currentIntensity,
      outcome: values.outcome || null,
      what_changed: values.whatChanged || null,
    })
    .eq("id", values.id)
    .eq("user_id", user.id)
    .is("reopened_at", null)
    .select("id")
    .maybeSingle();

  if (error) {
    // The database trigger is the final guard; this is what a refused early reopen looks like.
    console.error("[capsules] Reopen failed:", error.message);
    return { ok: false, message: GENERIC_ERROR };
  }
  if (!data) return { ok: false, message: "This capsule has already been opened." };

  revalidateCapsules();
  return { ok: true, data: undefined };
}

export async function deleteCapsule(id: string): Promise<ActionResult> {
  const user = await requireUser();
  const supabase = await createClient();

  const { error } = await supabase.from("worry_capsules").delete().eq("id", id).eq("user_id", user.id);
  if (error) {
    console.error("[capsules] Delete failed:", error.message);
    return { ok: false, message: "We couldn't delete that. Please try again." };
  }

  revalidateCapsules();
  return { ok: true, data: undefined };
}
