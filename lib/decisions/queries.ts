import "server-only";

import { requireUser } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import type { DecisionOptionRow, DecisionRoomDetail, DecisionRoomListItem } from "@/types";

/** Hard ceiling so one page can never become enormous. */
const MAX_ROOMS = 100;

export async function listDecisionRooms(): Promise<DecisionRoomListItem[]> {
  const user = await requireUser();
  const supabase = await createClient();

  const { data: rooms, error } = await supabase
    .from("decision_rooms")
    .select("*")
    .eq("user_id", user.id)
    .order("updated_at", { ascending: false })
    .limit(MAX_ROOMS);

  if (error) {
    console.error("[decisions] Could not load rooms:", error.message);
    throw new Error("Could not load your decisions.");
  }

  const list = rooms ?? [];
  if (list.length === 0) return [];

  // One narrow follow-up query instead of a nested select: the cards only need
  // the option names and whether a first step exists.
  const { data: options, error: optionsError } = await supabase
    .from("decision_options")
    .select("decision_room_id, name, first_step, position")
    .in(
      "decision_room_id",
      list.map((room) => room.id),
    )
    .order("position", { ascending: true });

  if (optionsError) {
    // The preview line is not worth failing the page for.
    console.error("[decisions] Could not load option previews:", optionsError.message);
    return list.map((room) => ({ ...room, optionCount: 0, optionNames: [], firstStepCount: 0 }));
  }

  return list.map((room) => {
    const mine = (options ?? []).filter((option) => option.decision_room_id === room.id);
    return {
      ...room,
      optionCount: mine.length,
      optionNames: mine.map((option) => option.name),
      firstStepCount: mine.filter((option) => (option.first_step ?? "").trim().length > 0).length,
    };
  });
}

/** One room with its options, or null when it does not exist for this user. */
export async function getDecisionRoom(id: string): Promise<DecisionRoomDetail | null> {
  const user = await requireUser();
  const supabase = await createClient();

  const { data: room, error } = await supabase
    .from("decision_rooms")
    .select("*")
    .eq("id", id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (error) {
    console.error("[decisions] Could not load room:", error.message);
    throw new Error("Could not load this decision.");
  }
  if (!room) return null;

  const { data: options, error: optionsError } = await supabase
    .from("decision_options")
    .select("*")
    .eq("decision_room_id", id)
    .order("position", { ascending: true })
    .order("created_at", { ascending: true });

  if (optionsError) {
    console.error("[decisions] Could not load options:", optionsError.message);
    throw new Error("Could not load this decision.");
  }

  return { ...room, options: (options ?? []) as DecisionOptionRow[] };
}
