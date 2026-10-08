/** Two-letter initials for avatar fallbacks. Falls back to the email, then "?". */
export function getInitials(name: string | null | undefined, email?: string | null): string {
  const source = name?.trim() || email?.split("@")[0]?.trim() || "";
  if (!source) return "?";

  const parts = source.split(/\s+/).filter(Boolean);
  const first = parts[0]?.[0] ?? "";
  const last = parts.length > 1 ? (parts[parts.length - 1]?.[0] ?? "") : "";
  return (first + last).toUpperCase() || "?";
}

/** First name for greetings. */
export function getFirstName(name: string | null | undefined): string {
  return name?.trim().split(/\s+/)[0] ?? "";
}
