"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireUser } from "@/lib/auth/session";
import { ROUTES } from "@/lib/constants/routes";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import type { ActionResult } from "@/types";

const GENERIC_ERROR = "We couldn't save that. Please try again.";

/** Turns the "Email notifications" preference on or off for the signed-in user. */
export async function updateNotificationPreference(enabled: boolean): Promise<ActionResult> {
  const user = await requireUser();
  const supabase = await createClient();

  const { error } = await supabase
    .from("profiles")
    .update({ notifications_enabled: enabled })
    .eq("user_id", user.id);

  if (error) {
    console.error("[settings] Could not update notification preference:", error.message);
    return { ok: false, message: GENERIC_ERROR };
  }

  revalidatePath(ROUTES.settings);
  return { ok: true, data: undefined };
}

/**
 * Permanently deletes the signed-in user's account and every row that belongs to them.
 *
 * Every product table has `on delete cascade` back to `auth.users` (see the Phase 1–4
 * migrations), so removing the auth user is enough to remove their thoughts, predictions,
 * capsules, decisions and insights along with it. This only ever touches the caller's own
 * account: the user id comes from the verified session, never from client input.
 */
export async function deleteAccount(): Promise<ActionResult> {
  const user = await requireUser();

  try {
    const admin = createAdminClient();
    const { error } = await admin.auth.admin.deleteUser(user.id);

    if (error) {
      console.error("[settings] Account deletion failed:", error.message);
      return { ok: false, message: GENERIC_ERROR };
    }
  } catch (caught) {
    console.error("[settings] Account deletion failed:", caught);
    return { ok: false, message: GENERIC_ERROR };
  }

  // Also clear the local session cookies before sending them away.
  const supabase = await createClient();
  await supabase.auth.signOut();

  redirect(ROUTES.login);
}
