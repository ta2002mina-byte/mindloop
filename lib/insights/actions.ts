"use server";

import { revalidatePath } from "next/cache";

import { requireUser } from "@/lib/auth/session";
import { ROUTES } from "@/lib/constants/routes";
import { weekStartOf } from "@/lib/insights/range";
import { createClient } from "@/lib/supabase/server";
import { reflectionSchema } from "@/lib/validations/insight";
import type { ActionResult } from "@/types";

/**
 * Saves the user's own words about their week. One row per user per week, so a
 * second save edits the first rather than piling up duplicates.
 */
export async function saveReflection(input: unknown): Promise<ActionResult> {
  const user = await requireUser();
  const parsed = reflectionSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message ?? "We couldn't save that. Please try again." };
  }

  // The week is decided on the server: a stale tab cannot write to another week.
  const weekStart = weekStartOf(new Date());
  if (parsed.data.weekStart !== weekStart) {
    return { ok: false, message: "The week has moved on since this page loaded. Reload and save again." };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("reflections")
    .upsert(
      { user_id: user.id, week_start: weekStart, content: parsed.data.content },
      { onConflict: "user_id,week_start" },
    );

  if (error) {
    console.error("[insights] Could not save reflection:", error.message);
    return { ok: false, message: "We couldn't save your reflection. Please try again." };
  }

  revalidatePath(ROUTES.insights);
  return { ok: true, data: undefined };
}

export async function deleteReflection(id: string): Promise<ActionResult> {
  const user = await requireUser();
  const supabase = await createClient();

  const { error } = await supabase.from("reflections").delete().eq("id", id).eq("user_id", user.id);
  if (error) {
    console.error("[insights] Could not delete reflection:", error.message);
    return { ok: false, message: "We couldn't delete that. Please try again." };
  }

  revalidatePath(ROUTES.insights);
  return { ok: true, data: undefined };
}
