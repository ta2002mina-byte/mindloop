import "server-only";

import { MockThoughtAnalyst } from "@/lib/ai/mock-analyst";
import { OpenAiThoughtAnalyst } from "@/lib/ai/openai-analyst";
import type { ThoughtAnalyst } from "@/lib/ai/types";

/**
 * Chooses the provider from the environment, once per server process.
 *
 * AI_PROVIDER=mock   forces the on-device analyst, even if a key is present.
 * AI_PROVIDER=openai uses OPENAI_API_KEY (default when a key exists).
 *
 * With no key the app falls back to MockThoughtAnalyst, so every feature keeps
 * working. None of these variables are NEXT_PUBLIC_, so no key reaches the browser.
 */
const DEFAULT_BASE_URL = "https://api.openai.com/v1";
const DEFAULT_MODEL = "gpt-4o-mini";
const DEFAULT_TIMEOUT_MS = 20_000;

let cached: ThoughtAnalyst | null = null;

export function getThoughtAnalyst(): ThoughtAnalyst {
  if (cached) return cached;

  const requested = (process.env.AI_PROVIDER ?? "").trim().toLowerCase();
  const apiKey = (process.env.OPENAI_API_KEY ?? "").trim();

  if (requested !== "mock" && apiKey) {
    const timeout = Number.parseInt(process.env.AI_TIMEOUT_MS ?? "", 10);

    cached = new OpenAiThoughtAnalyst({
      apiKey,
      baseUrl: (process.env.OPENAI_BASE_URL ?? "").trim() || DEFAULT_BASE_URL,
      model: (process.env.OPENAI_MODEL ?? "").trim() || DEFAULT_MODEL,
      timeoutMs: Number.isFinite(timeout) && timeout > 1000 ? timeout : DEFAULT_TIMEOUT_MS,
    });
    return cached;
  }

  if (requested === "openai" && !apiKey) {
    console.warn("[ai] AI_PROVIDER=openai but OPENAI_API_KEY is empty. Falling back to the on-device analyst.");
  }

  cached = new MockThoughtAnalyst();
  return cached;
}

/** True when a real model is configured. Used for wording, never for gating. */
export function isRemoteAnalystConfigured(): boolean {
  return getThoughtAnalyst().id !== "mock";
}
