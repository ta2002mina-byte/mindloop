import type { AuthError } from "@supabase/supabase-js";

/** Turns Supabase auth errors into friendly, actionable messages. */
export function getAuthErrorMessage(error: Pick<AuthError, "message" | "code" | "status">): string {
  switch (error.code) {
    case "invalid_credentials":
      return "That email and password don't match. Check them and try again.";
    case "email_not_confirmed":
      return "Confirm your email first. We sent you a link when you signed up.";
    case "user_already_exists":
    case "email_exists":
      return "An account with this email already exists. Try logging in instead.";
    case "weak_password":
      return "Choose a stronger password with at least 8 characters.";
    case "same_password":
      return "Choose a password you haven't used before.";
    case "over_email_send_rate_limit":
    case "over_request_rate_limit":
      return "Too many attempts. Wait a minute, then try again.";
    case "signup_disabled":
      return "New sign-ups are turned off right now.";
    default:
      break;
  }

  if (/fetch|network/i.test(error.message)) {
    return "We couldn't reach the server. Check your connection and try again.";
  }

  return "Something went wrong. Please try again.";
}

export const NETWORK_ERROR_MESSAGE = "We couldn't reach the server. Check your connection and try again.";
