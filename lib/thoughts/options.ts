import "server-only";

import { requireUser } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import type { ThoughtOption } from "@/types";

/**
 * Id and title only, for the "which thought is this about?" pickers.
 * Archived thoughts are left out; newest first.
 */
export async function listThoughtOptions(): Promise<ThoughtOption[]> {
  const user = await requireUser();
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("thoughts")
    .select("id, title")
    .eq("user_id", user.id)
    .neq("status", "archived")
    .order("created_at", { ascending: false })
    .limit(200);

  if (error) {
    console.error("[thoughts] Could not load thought options:", error.message);
    throw new Error("Could not load your thoughts.");
  }

  return data ?? [];
}
