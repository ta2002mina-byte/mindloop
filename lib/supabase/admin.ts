import "server-only";

import { createClient as createSupabaseClient } from "@supabase/supabase-js";

import { getSupabaseEnv } from "@/lib/supabase/env";
import type { Database } from "@/types/database";

/**
 * Admin Supabase client using the service-role key.
 *
 * This bypasses Row Level Security, so it must only ever be imported from server-only code
 * (Server Actions, Route Handlers) and never from anything bundled for the browser.
 * The "server-only" import above makes any accidental client-side import fail at build time.
 *
 * Today this is used for exactly one thing: permanently deleting a user's auth account when
 * they choose "Delete account" in Settings. The anon key cannot do this — only the admin API can.
 */
export function createAdminClient() {
  const { url } = getSupabaseEnv();
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!serviceRoleKey) {
    throw new Error(
      "Missing SUPABASE_SERVICE_ROLE_KEY. Set it in .env.local (Supabase Dashboard → Project Settings → API). " +
        "Keep it server-only — never prefix it with NEXT_PUBLIC_.",
    );
  }

  return createSupabaseClient<Database>(url, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
