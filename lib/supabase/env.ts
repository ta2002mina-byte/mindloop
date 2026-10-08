/**
 * Reads the public Supabase settings. Only NEXT_PUBLIC_ values live here:
 * the service-role key must never be imported by anything that can reach the browser.
 *
 * Note: the literal `process.env.NEXT_PUBLIC_*` form is required so Next.js can inline the values.
 */
export function getSupabaseEnv() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    throw new Error(
      "Missing Supabase environment variables. Copy .env.example to .env.local and set " +
        "NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY, then restart the dev server.",
    );
  }

  return { url, anonKey };
}
