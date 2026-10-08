import "server-only";

/**
 * A small per-user throttle for AI calls.
 *
 * This lives in process memory, so it resets on deploy and is per-instance: it
 * is a guard against an accidental loop of requests from one browser, not a
 * billing control. A real quota belongs in the database or at the gateway.
 */
const WINDOW_MS = 60_000;
const MAX_CALLS_PER_WINDOW = 8;

const calls = new Map<string, number[]>();

export interface RateLimitResult {
  allowed: boolean;
  /** Whole seconds until the next call is allowed. */
  retryAfterSeconds: number;
}

export function checkAiRateLimit(userId: string, now: number = Date.now()): RateLimitResult {
  const recent = (calls.get(userId) ?? []).filter((time) => now - time < WINDOW_MS);

  if (recent.length >= MAX_CALLS_PER_WINDOW) {
    const oldest = recent[0] ?? now;
    calls.set(userId, recent);
    return { allowed: false, retryAfterSeconds: Math.max(1, Math.ceil((WINDOW_MS - (now - oldest)) / 1000)) };
  }

  recent.push(now);
  calls.set(userId, recent);

  // Stop the map growing without bound on a long-running instance.
  if (calls.size > 500) {
    for (const [key, times] of calls) {
      if (times.every((time) => now - time >= WINDOW_MS)) calls.delete(key);
    }
  }

  return { allowed: true, retryAfterSeconds: 0 };
}
