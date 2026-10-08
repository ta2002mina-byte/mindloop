import { PATTERN_DEFINITIONS, matchPatterns, normaliseText, type PatternId } from "@/lib/pattern-detector";
import { CONTEXT_DEFINITIONS } from "@/lib/trigger-detector";
import type { ThoughtAnalysis, ThoughtAnalyst, ThoughtAnalystInput } from "@/lib/ai/types";

/**
 * The fallback analyst, used whenever no AI key is configured.
 *
 * It is not a pretend language model: it reuses the same pattern and context
 * detectors as the Patterns page, so the output is real, explainable and
 * reproducible. No network call, no key, and the app is fully usable without one.
 */

const ASSUMPTION_MARKERS = [
  /\bi (think|feel|assume|bet|reckon|worry|know) (that )?\b/,
  /\b(probably|definitely|obviously|surely|clearly|must be|must have|they'll|he'll|she'll|it'll)\b/,
  /\b(everyone|nobody|no one|always|never|every time)\b/,
  /\b(what if|maybe|might|could be|going to|will be)\b/,
  /\b(means|meant) (that )?\b/,
  /\b(disappointed|annoyed|angry|judging|thinks?) (in|with|at|about) me\b/,
];

const FACT_MARKERS = [
  /\b(said|told|wrote|sent|replied|asked|called|messaged|emailed)\b/,
  /\b(happened|arrived|started|finished|ended|left|cancelled|canceled|posted|handed in)\b/,
  /\b(was|were|did|didn't|has|have|hasn't|haven't) \b/,
  /\b(yesterday|today|this morning|last (night|week|month)|on (monday|tuesday|wednesday|thursday|friday|saturday|sunday))\b/,
  /\b\d+\b/,
];

/** One or two open questions per pattern. Questions only: never advice. */
const PATTERN_QUESTIONS: Record<PatternId, readonly string[]> = {
  what_if: [
    "A question worth asking: which of these what-ifs has actually happened before?",
    "If the thing you are imagining did happen, what is the first thing you would do?",
  ],
  replaying: ["A question worth asking: what would close this off enough for you to set it down?"],
  future_prediction: ["A question worth asking: what would you need to see to know this prediction was wrong?"],
  decision_looping: [
    "A question worth asking: what information would actually change your answer?",
    "If you had to choose in ten minutes, which way would you lean, and why?",
  ],
  perfection: ["A question worth asking: what would 'good enough for now' look like here?"],
  social_interpretation: [
    "A question worth asking: what else could explain what they did, if it had nothing to do with you?",
  ],
  worst_case: ["A question worth asking: how likely does the worst version feel when you write it out in full?"],
};

const GENERIC_QUESTIONS = [
  "A question worth asking: which part of this is yours to decide?",
  "A question worth asking: what do you actually know, as opposed to what you are filling in?",
];

/** A small next step per context theme. Deliberately tiny and concrete. */
const CONTEXT_ACTIONS: Record<string, string> = {
  uncertainty: "Write down the one question you need answered, and who could answer it.",
  being_evaluated: "Note the single thing you would change before it is looked at, and stop there.",
  time_pressure: "Give the smallest piece of this ten minutes today, and nothing more.",
  disagreement: "Draft one sentence you would be willing to say to them out loud.",
  change: "List what stays the same after this change, alongside what does not.",
  money_pressure: "Write the one number you are unsure of, and where you could check it.",
  being_left_out: "Send one short message to one person you would like to hear from.",
};

const DEFAULT_ACTION = "Pick the smallest part of this you could start today, and give it ten minutes.";

function sentences(text: string): string[] {
  return text
    .split(/(?:[.!?]+|\n+)/)
    .map((part) => part.replace(/\s+/g, " ").trim())
    .filter((part) => part.length >= 12);
}

function matchesAny(haystack: string, expressions: readonly RegExp[]): boolean {
  return expressions.some((expression) => expression.test(haystack));
}

/** "because I left it late" → the clause after a causal word, as a trigger guess. */
function guessTrigger(text: string): string {
  const match = text.match(/\b(?:because|after|when|since|once)\b\s+([^.!?\n]{6,120})/i);
  if (!match?.[1]) return "";
  return match[1].replace(/\s+/g, " ").trim();
}

function countRepeats(text: string): number {
  const words = normaliseText(text)
    .replace(/[^\p{L}\p{N}\s']/gu, " ")
    .split(/\s+/)
    .filter((word) => word.length > 4);

  const counts = new Map<string, number>();
  for (const word of words) counts.set(word, (counts.get(word) ?? 0) + 1);
  return [...counts.values()].filter((count) => count >= 3).length;
}

export class MockThoughtAnalyst implements ThoughtAnalyst {
  readonly id = "mock" as const;
  readonly label = "On-device patterns";

  async analyze(input: ThoughtAnalystInput): Promise<ThoughtAnalysis> {
    const raw = input.rawText.trim();
    const haystack = normaliseText(`${input.trigger ?? ""} ${raw}`);
    const parts = sentences(raw);

    const assumptions: string[] = [];
    const facts: string[] = [];

    for (const part of parts) {
      const lower = normaliseText(part);
      const looksLikeAssumption = matchesAny(lower, ASSUMPTION_MARKERS);

      if (looksLikeAssumption) {
        if (assumptions.length < 4) assumptions.push(part);
        continue;
      }
      // Only sentences with something checkable in them, and never a question.
      if (!part.endsWith("?") && matchesAny(lower, FACT_MARKERS) && facts.length < 4) {
        facts.push(part);
      }
    }

    const patterns = matchPatterns(raw);
    const patternById = new Map(PATTERN_DEFINITIONS.map((definition) => [definition.id, definition]));

    const questions: string[] = [];
    for (const match of patterns) {
      for (const question of PATTERN_QUESTIONS[match.id] ?? []) {
        if (questions.length < 4 && !questions.includes(question)) questions.push(question);
      }
    }
    for (const question of GENERIC_QUESTIONS) {
      if (questions.length < 4 && !questions.includes(question)) questions.push(question);
    }

    const loopIndicators: string[] = [];
    for (const match of patterns.slice(0, 3)) {
      const definition = patternById.get(match.id);
      if (!definition) continue;
      const terms = match.terms.slice(0, 2).join(", ");
      loopIndicators.push(
        terms
          ? `The wording lines up with ${definition.label.toLowerCase()} (“${terms}”).`
          : `The wording lines up with ${definition.label.toLowerCase()}.`,
      );
    }
    if (countRepeats(raw) >= 2) {
      loopIndicators.push("Several words come back three or more times, which can mean the thought is circling.");
    }
    if (assumptions.length > 0 && facts.length === 0) {
      loopIndicators.push("There is a lot being interpreted here and little that is checkable yet.");
    }

    const context = CONTEXT_DEFINITIONS.find((definition) =>
      definition.terms.some((term) => new RegExp(term, "i").test(haystack)),
    );

    const mainThought =
      parts.find((part) => matchesAny(normaliseText(part), ASSUMPTION_MARKERS)) ??
      parts[0] ??
      raw.slice(0, 200);

    return {
      trigger: input.trigger?.trim() || guessTrigger(raw),
      mainThought,
      possibleAssumptions: assumptions,
      observableFacts: facts,
      reflectionQuestions: questions,
      possibleLoopIndicators: loopIndicators.slice(0, 4),
      suggestedSmallAction: (context && CONTEXT_ACTIONS[context.id]) || DEFAULT_ACTION,
    };
  }
}
