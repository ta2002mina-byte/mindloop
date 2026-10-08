import { NextResponse, type NextRequest } from "next/server";

import { getSafeRedirectPath } from "@/lib/auth/redirect";
import { ROUTES } from "@/lib/constants/routes";
import { createClient } from "@/lib/supabase/server";

/**
 * Landing point for links in Supabase emails (signup confirmation and password recovery).
 * Exchanges the one-time `code` for a session cookie, then forwards to `next`.
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const code = searchParams.get("code");
  const next = getSafeRedirectPath(searchParams.get("next"));

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(new URL(next, origin));
    }
    console.error("[auth] Code exchange failed:", error.message);
  }

  // Expired, reused, or opened in another browser. Send people somewhere they can recover.
  const failurePath = next === ROUTES.resetPassword ? ROUTES.forgotPassword : ROUTES.login;
  return NextResponse.redirect(new URL(`${failurePath}?error=auth_callback`, origin));
}
