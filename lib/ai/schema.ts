import { z } from "zod";

import type { ThoughtAnalysis } from "@/lib/ai/types";

/**
 * Every provider's output goes through this before the app trusts it. A model
 * can return the wrong shape, extra fields, empty strings or a hundred bullet
 * points, so lists are trimmed, blanks dropped and lengths capped here rather
 * than in the UI.
 */
const MAX_ITEMS = 6;
const MAX_ITEM_CHARS = 240;

const bulletList = z
  .array(z.unknown())
  .catch([])
  .transform((items) =>
    items
      .filter((item): item is string => typeof item === "string")
      .map((item) => item.replace(/\s+/g, " ").trim())
      .filter((item) => item.length > 0)
      .map((item) => (item.length > MAX_ITEM_CHARS ? `${item.slice(0, MAX_ITEM_CHARS - 1).trimEnd()}…` : item))
      .slice(0, MAX_ITEMS),
  );

const line = (maxChars: number) =>
  z
    .unknown()
    .transform((value) => (typeof value === "string" ? value.replace(/\s+/g, " ").trim() : ""))
    .transform((value) => (value.length > maxChars ? `${value.slice(0, maxChars - 1).trimEnd()}…` : value));

export const thoughtAnalysisSchema = z.object({
  trigger: line(200),
  mainThought: line(400),
  possibleAssumptions: bulletList,
  observableFacts: bulletList,
  reflectionQuestions: bulletList,
  possibleLoopIndicators: bulletList,
  suggestedSmallAction: line(200),
});

/**
 * Parses whatever a provider returned. Missing fields become empty rather than
 * throwing: a partial analysis is still useful, and the user edits it anyway.
 */
export function parseAnalysis(value: unknown): ThoughtAnalysis {
  const source = typeof value === "object" && value !== null ? (value as Record<string, unknown>) : {};

  return thoughtAnalysisSchema.parse({
    trigger: source.trigger,
    mainThought: source.mainThought,
    possibleAssumptions: source.possibleAssumptions,
    observableFacts: source.observableFacts,
    reflectionQuestions: source.reflectionQuestions,
    possibleLoopIndicators: source.possibleLoopIndicators,
    suggestedSmallAction: source.suggestedSmallAction,
  });
}

/** Pulls the first JSON object out of a reply that may be wrapped in prose or fences. */
export function extractJsonObject(text: string): unknown {
  const withoutFences = text.replace(/```(?:json)?/gi, "").trim();

  try {
    return JSON.parse(withoutFences);
  } catch {
    const start = withoutFences.indexOf("{");
    const end = withoutFences.lastIndexOf("}");
    if (start === -1 || end <= start) return null;
    try {
      return JSON.parse(withoutFences.slice(start, end + 1));
    } catch {
      return null;
    }
  }
}
