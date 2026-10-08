import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

import { ROUTES, isAuthOnlyPath, isProtectedPath } from "@/lib/constants/routes";
import { getSupabaseEnv } from "@/lib/supabase/env";
import type { Database } from "@/types/database";

/** Copies refreshed session cookies onto a redirect so the browser keeps the new tokens. */
function redirectTo(request: NextRequest, source: NextResponse, pathname: string, search = "") {
  const url = request.nextUrl.clone();
  url.pathname = pathname;
  url.search = search;

  const redirect = NextResponse.redirect(url);
  source.cookies.getAll().forEach((cookie) => redirect.cookies.set(cookie));
  return redirect;
}

/**
 * Refreshes the Supabase session on every request and enforces route protection.
 * getUser() validates the token with Supabase (unlike getSession(), which trusts the cookie).
 */
export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });
  const { url, anonKey } = getSupabaseEnv();

  const supabase = createServerClient<Database>(url, anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;

  if (!user && isProtectedPath(pathname)) {
    const next = `${pathname}${request.nextUrl.search}`;
    return redirectTo(request, response, ROUTES.login, `?next=${encodeURIComponent(next)}`);
  }

  if (user && isAuthOnlyPath(pathname)) {
    return redirectTo(request, response, ROUTES.dashboard);
  }

  return response;
}
