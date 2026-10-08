import { ROUTES } from "@/lib/constants/routes";

/**
 * Only allow same-site relative paths after login, to avoid open-redirect attacks.
 * "/dashboard" is fine; "https://evil.com", "//evil.com" and "/\evil.com" are not.
 */
export function getSafeRedirectPath(next: string | null | undefined, fallback: string = ROUTES.dashboard): string {
  if (!next) return fallback;
  if (!next.startsWith("/") || next.startsWith("//") || next.startsWith("/\\")) return fallback;
  return next;
}
