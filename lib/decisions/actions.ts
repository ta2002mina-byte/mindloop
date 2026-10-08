"use server";

import { revalidatePath } from "next/cache";

import { requireUser } from "@/lib/auth/session";
import { ROUTES, decisionRoute } from "@/lib/constants/routes";
import { createClient } from "@/lib/supabase/server";
import { decisionOptionNameSchema, decisionOptionSchema, decisionRoomSchema } from "@/lib/validations/decision";
import type { ActionResult } from "@/types";

const GENERIC_ERROR = "We couldn't save that. Please try again.";
const NOT_FOUND = "We couldn't find that decision. It may have been deleted.";

/** The three columns from the product example, created with every new room. */
const STARTER_OPTIONS = ["Option A", "Option B", "Wait"] as const;

/** Keeps the list caps of decision_options in step with the database constraint. */
const MAX_OPTIONS = 6;

function revalidateRoom(id?: string) {
  revalidatePath(ROUTES.decisions);
  if (id) revalidatePath(decisionRoute(id));
}

export async function createDecisionRoom(input: unknown): Promise<ActionResult<{ id: string }>> {
  const user = await requireUser();
  const parsed = decisionRoomSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message ?? GENERIC_ERROR };
  }

  const supabase = await createClient();
  const { data: room, error } = await supabase
    .from("decision_rooms")
    .insert({
      user_id: user.id,
      title: parsed.data.title,
      description: parsed.data.description || null,
    })
    .select("id")
    .single();

  if (error || !room) {
    console.error("[decisions] Create room failed:", error?.message);
    return { ok: false, message: GENERIC_ERROR };
  }

  // Starter columns, so the board is never an empty grid. They are renameable
  // and deletable like any other option.
  const { error: optionsError } = await supabase.from("decision_options").insert(
    STARTER_OPTIONS.map((name, index) => ({
      decision_room_id: room.id,
      name,
      position: index,
    })),
  );

  if (optionsError) {
    // Undo the room so the user never lands on a half-created board.
    console.error("[decisions] Create starter options failed:", optionsError.message);
    await supabase.from("decision_rooms").delete().eq("id", room.id);
    return { ok: false, message: GENERIC_ERROR };
  }

  revalidateRoom(room.id);
  return { ok: true, data: { id: room.id } };
}

export async function updateDecisionRoom(id: string, input: unknown): Promise<ActionResult> {
  const user = await requireUser();
  const parsed = decisionRoomSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message ?? GENERIC_ERROR };
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("decision_rooms")
    .update({ title: parsed.data.title, description: parsed.data.description || null })
    .eq("id", id)
    .eq("user_id", user.id)
    .select("id")
    .maybeSingle();

  if (error) {
    console.error("[decisions] Update room failed:", error.message);
    return { ok: false, message: GENERIC_ERROR };
  }
  if (!data) return { ok: false, message: NOT_FOUND };

  revalidateRoom(id);
  return { ok: true, data: undefined };
}

export async function deleteDecisionRoom(id: string): Promise<ActionResult> {
  const user = await requireUser();
  const supabase = await createClient();

  // The options go with it: the foreign key is ON DELETE CASCADE.
  const { error } = await supabase.from("decision_rooms").delete().eq("id", id).eq("user_id", user.id);
  if (error) {
    console.error("[decisions] Delete room failed:", error.message);
    return { ok: false, message: "We couldn't delete that. Please try again." };
  }

  revalidateRoom(id);
  return { ok: true, data: undefined };
}

export async function addDecisionOption(roomId: string, input: unknown): Promise<ActionResult> {
  await requireUser();
  const parsed = decisionOptionNameSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message ?? GENERIC_ERROR };
  }

  const supabase = await createClient();

  // RLS decides whether this room is the user's; the count is only for the cap.
  const { data: existing, error: countError } = await supabase
    .from("decision_options")
    .select("position")
    .eq("decision_room_id", roomId)
    .order("position", { ascending: false })
    .limit(MAX_OPTIONS);

  if (countError) {
    console.error("[decisions] Could not count options:", countError.message);
    return { ok: false, message: GENERIC_ERROR };
  }
  if ((existing ?? []).length >= MAX_OPTIONS) {
    return { ok: false, message: `A board holds up to ${MAX_OPTIONS} options. Remove one first.` };
  }

  const nextPosition = (existing?.[0]?.position ?? -1) + 1;

  const { error } = await supabase
    .from("decision_options")
    .insert({ decision_room_id: roomId, name: parsed.data.name, position: nextPosition });

  if (error) {
    console.error("[decisions] Add option failed:", error.message);
    return { ok: false, message: GENERIC_ERROR };
  }

  await touchRoom(roomId);
  revalidateRoom(roomId);
  return { ok: true, data: undefined };
}

export async function updateDecisionOption(
  roomId: string,
  optionId: string,
  input: unknown,
): Promise<ActionResult> {
  await requireUser();
  const parsed = decisionOptionSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message ?? GENERIC_ERROR };
  }

  const supabase = await createClient();
  const values = parsed.data;

  const { data, error } = await supabase
    .from("decision_options")
    .update({
      name: values.name,
      benefits: values.benefits,
      concerns: values.concerns,
      known_facts: values.knownFacts,
      unknowns: values.unknowns,
      controllable_items: values.controllableItems,
      first_step: values.firstStep || null,
    })
    .eq("id", optionId)
    .eq("decision_room_id", roomId)
    .select("id")
    .maybeSingle();

  if (error) {
    console.error("[decisions] Update option failed:", error.message);
    return { ok: false, message: GENERIC_ERROR };
  }
  if (!data) return { ok: false, message: "We couldn't find that option. It may have been deleted." };

  await touchRoom(roomId);
  revalidateRoom(roomId);
  return { ok: true, data: undefined };
}

export async function deleteDecisionOption(roomId: string, optionId: string): Promise<ActionResult> {
  await requireUser();
  const supabase = await createClient();

  const { error } = await supabase
    .from("decision_options")
    .delete()
    .eq("id", optionId)
    .eq("decision_room_id", roomId);

  if (error) {
    console.error("[decisions] Delete option failed:", error.message);
    return { ok: false, message: "We couldn't delete that option. Please try again." };
  }

  await touchRoom(roomId);
  revalidateRoom(roomId);
  return { ok: true, data: undefined };
}

/**
 * Bumps the room's updated_at so the list stays in "most recently worked on"
 * order after an option changes. RLS still applies, so this can only ever
 * touch the user's own room.
 */
async function touchRoom(roomId: string): Promise<void> {
  const user = await requireUser();
  const supabase = await createClient();

  const { error } = await supabase
    .from("decision_rooms")
    .update({ updated_at: new Date().toISOString() })
    .eq("id", roomId)
    .eq("user_id", user.id);

  if (error) console.error("[decisions] Could not touch room:", error.message);
}
