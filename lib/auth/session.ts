import "server-only";

import { cache } from "react";
import { redirect } from "next/navigation";

import { ROUTES } from "@/lib/constants/routes";
import { createClient } from "@/lib/supabase/server";
import type { Profile } from "@/types";

/** The signed-in user, validated with Supabase. Cached per request. */
export const getCurrentUser = cache(async () => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
});

/** Same as getCurrentUser, but redirects to /login when nobody is signed in. */
export async function requireUser() {
  const user = await getCurrentUser();
  if (!user) redirect(ROUTES.login);
  return user;
}

/**
 * The signed-in user's profile row. Cached per request.
 * A database trigger normally creates it at signup; if it is missing (for example, for an account
 * created before the migration ran) we create it here, which RLS allows for the user's own row.
 * Returns null instead of throwing so a profile hiccup never locks someone out of the app.
 */
export const getCurrentProfile = cache(async (): Promise<Profile | null> => {
  const user = await requireUser();
  const supabase = await createClient();

  const existing = await supabase.from("profiles").select("*").eq("user_id", user.id).maybeSingle();
  if (existing.error) {
    console.error("[profiles] Could not load profile:", existing.error.message);
    return null;
  }
  if (existing.data) return existing.data;

  const metadataName = typeof user.user_metadata?.full_name === "string" ? user.user_metadata.full_name : null;
  const created = await supabase
    .from("profiles")
    .insert({ user_id: user.id, full_name: metadataName })
    .select("*")
    .single();

  if (created.error) {
    // Most likely a race with the signup trigger. Try reading once more.
    const retry = await supabase.from("profiles").select("*").eq("user_id", user.id).maybeSingle();
    if (retry.data) return retry.data;
    console.error("[profiles] Could not create profile:", created.error.message);
    return null;
  }

  return created.data;
});
