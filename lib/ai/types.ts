/**
 * The contract between the app and whatever produces a thought analysis.
 *
 * Everything the UI touches is defined here, so a provider can be swapped
 * without a single component changing. Nothing in this file imports a provider.
 */

export interface ThoughtAnalystInput {
  /** The raw thought, exactly as the user wrote it. */
  rawText: string;
  /** What set it off, if the user named one. */
  trigger?: string;
  /** The area they filed it under, if chosen. */
  category?: string;
}

/**
 * The structured result. Every field is a suggestion the user can edit, keep or
 * throw away: nothing here is saved until they choose to apply it.
 *
 * Deliberately absent: any diagnosis, score, label for the person, or claim
 * about what is "really" going on. See lib/ai/prompt.ts for the wording rules.
 */
export interface ThoughtAnalysis {
  /** The trigger the text points at, in the user's own words where possible. */
  trigger: string;
  /** The central thought, restated plainly. */
  mainThought: string;
  /** Things the text treats as given that may be assumptions. */
  possibleAssumptions: string[];
  /** Parts of the text that are observable, checkable events. */
  observableFacts: string[];
  /** Open questions for the user to sit with. Never rhetorical. */
  reflectionQuestions: string[];
  /** Signs the thought may be going in circles. Descriptive, never a verdict. */
  possibleLoopIndicators: string[];
  /** One small, concrete step. */
  suggestedSmallAction: string;
}

/** Which provider produced a result, shown in the UI so the user always knows. */
export type AnalystProviderId = "mock" | "openai";

export interface ThoughtAnalysisResult {
  analysis: ThoughtAnalysis;
  provider: AnalystProviderId;
  /** Provider label for the UI, for example "On-device patterns" or "gpt-4o-mini". */
  providerLabel: string;
}

export interface ThoughtAnalyst {
  readonly id: AnalystProviderId;
  readonly label: string;
  analyze(input: ThoughtAnalystInput): Promise<ThoughtAnalysis>;
}

/** Thrown when a provider fails in a way worth telling the user about. */
export class AnalystError extends Error {
  readonly userMessage: string;

  constructor(userMessage: string, cause?: unknown) {
    super(userMessage);
    this.name = "AnalystError";
    this.userMessage = userMessage;
    if (cause instanceof Error) this.stack = `${this.stack}\nCaused by: ${cause.stack}`;
  }
}

export const EMPTY_ANALYSIS: ThoughtAnalysis = {
  trigger: "",
  mainThought: "",
  possibleAssumptions: [],
  observableFacts: [],
  reflectionQuestions: [],
  possibleLoopIndicators: [],
  suggestedSmallAction: "",
};
