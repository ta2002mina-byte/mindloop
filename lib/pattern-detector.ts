/**
 * Overthinking Fingerprint: deterministic pattern detection.
 *
 * WHY THIS FILE LOOKS THE WAY IT DOES
 * - It is plain TypeScript with no React, no Supabase and no server-only code, so
 *   it can be unit-tested, run in a script, or swapped for a smarter detector
 *   (an ML model, an AI call) without touching a single component. Anything that
 *   replaces it only has to return a `PatternReport`.
 * - Every result can be explained. A thought is only linked to a pattern when
 *   specific words or phrases in the user's own text match, and those words are
 *   returned so the UI can show them. There is no hidden scoring.
 * - It describes ENTRIES, never people. Nothing here diagnoses anyone: "more
 *   activity around X in recent entries" is the strongest claim it can make.
 *
 * All day maths uses UTC, matching utils/date.ts and the database.
 */

export type PatternId =
  | "what_if"
  | "replaying"
  | "future_prediction"
  | "decision_looping"
  | "perfection"
  | "social_interpretation"
  | "worst_case";

export type DetectorTrafficLight = "green" | "yellow" | "red";

/** The minimal, already-flattened shape the detector needs. Built on the server. */
export interface DetectorThought {
  id: string;
  title: string;
  category: string;
  trigger: string | null;
  trafficLight: DetectorTrafficLight;
  /** ISO timestamp. */
  createdAt: string;
  /** Title + the thought itself + the stories the user wrote, joined. */
  text: string;
}

export interface DetectorOptions {
  /** Length of the "recent" window in days (for example 30). */
  windowDays: number;
  /** Injectable clock, so results are reproducible. Defaults to now. */
  now?: Date;
}

/* -------------------------------------------------------------------------- */
/* Pattern definitions                                                        */
/* -------------------------------------------------------------------------- */

export interface PatternDefinition {
  id: PatternId;
  label: string;
  /** Neutral one-liner describing the kind of thinking, not the person. */
  description: string;
  /** Regex sources, matched case-insensitively against the lower-cased entry text. */
  terms: readonly string[];
}

/**
 * Edit this list to tune detection. Each term is a regular expression source.
 * Keep terms specific: a term that matches almost every sentence ("will", "not")
 * would flag everything and tell the user nothing.
 */
export const PATTERN_DEFINITIONS: readonly PatternDefinition[] = [
  {
    id: "what_if",
    label: "What-if thinking",
    description: "Entries that follow a chain of possibilities: what if this, what if that.",
    terms: [
      "\\bwhat if\\b",
      "\\bwhat happens if\\b",
      "\\bwhat would happen\\b",
      "\\bwhat will happen if\\b",
      "\\bjust in case\\b",
      "\\bsuppose (that|i|they|he|she|it)\\b",
    ],
  },
  {
    id: "replaying",
    label: "Replaying conversations",
    description: "Entries that go back over something that was said or done.",
    terms: [
      "\\breplay(ing|ed)?\\b",
      "\\brewind(ing)?\\b",
      "\\bover and over\\b",
      "\\bgoing over\\b",
      "\\bkeep (thinking|going over|remembering|replaying)\\b",
      "\\b(what|how) i said\\b",
      "\\bshould(n't| not)? have (said|done|sent|replied|told)\\b",
      "\\bwhy did i (say|do|send|reply|tell)\\b",
      "\\bcringe\\b",
      "\\bthe way i (said|acted|reacted)\\b",
    ],
  },
  {
    id: "future_prediction",
    label: "Future prediction",
    description: "Entries that forecast how something will turn out.",
    terms: [
      "\\bgoing to (fail|happen|go wrong|be (bad|terrible|awful|a disaster))\\b",
      "\\bwill (probably|definitely|surely|never|always|end up|fail|go wrong|not)\\b",
      "\\bbound to\\b",
      "\\bend up\\b",
      "\\bin the (future|long run)\\b",
      "\\bnext (week|month|year)\\b",
      "\\bsomeday\\b",
      "\\beventually\\b",
      "\\bi (just )?know (it|that|this|they|he|she)\\b",
      "\\bi('m| am) sure (it|that|this|they|he|she)\\b",
    ],
  },
  {
    id: "decision_looping",
    label: "Decision looping",
    description: "Entries that weigh the same options again without settling.",
    terms: [
      "\\bshould i\\b",
      "\\bor should i\\b",
      "\\bcan't (decide|choose)\\b",
      "\\bcannot (decide|choose)\\b",
      "\\btorn between\\b",
      "\\bpros and cons\\b",
      "\\bon the one hand\\b",
      "\\bwhich (one|option|path) (is|would be) (better|right)\\b",
      "\\bmake the (right|wrong) (choice|decision)\\b",
      "\\bkeep going back and forth\\b",
      "\\bback and forth\\b",
    ],
  },
  {
    id: "perfection",
    label: "Perfection thinking",
    description: "Entries that hold something to a very high or exact standard.",
    terms: [
      "\\bperfect(ly|ion|ionist)?\\b",
      "\\bflawless(ly)?\\b",
      "\\bnot good enough\\b",
      "\\bget it (exactly )?right\\b",
      "\\bcan't afford to (fail|mess|get it wrong|make a mistake)\\b",
      "\\bmess(ed)? (it )?up\\b",
      "\\bno room for (error|mistakes?)\\b",
      "\\bhave to be (perfect|flawless|the best)\\b",
      "\\bmust be (perfect|flawless)\\b",
      "\\bmistakes?\\b",
    ],
  },
  {
    id: "social_interpretation",
    label: "Social interpretation",
    description: "Entries that read meaning into what other people did or did not do.",
    terms: [
      "\\bthink(s|ing)? (of|about) me\\b",
      "\\bthink (i'm|i am|i was)\\b",
      "\\bjudg(e|es|ed|ing) me\\b",
      "\\b(annoyed|upset|mad|angry|disappointed) (with|at) me\\b",
      "\\b(ignor(e|ed|es|ing)) me\\b",
      "\\bdidn't (reply|respond|text|call|answer|say anything)\\b",
      "\\bleft me on (read|seen)\\b",
      "\\bwhat (do|does|did|would) (they|he|she|people|everyone) think\\b",
      "\\bseem(s|ed)? (upset|angry|distant|cold|annoyed|off)\\b",
      "\\b(hate|hates|dislike|dislikes) me\\b",
      "\\btone\\b",
      "\\bhidden meaning\\b",
    ],
  },
  {
    id: "worst_case",
    label: "Worst-case thinking",
    description: "Entries that jump to the most difficult way things could go.",
    terms: [
      "\\bworst( case| scenario)?\\b",
      "\\bdisaster\\b",
      "\\bcatastroph(e|ic|ize|izing)\\b",
      "\\bruin(ed|s|ing)? (everything|my|the|it)\\b",
      "\\beverything (will|is going to|would) (fall apart|go wrong|collapse)\\b",
      "\\bnever (recover|get over|be able to)\\b",
      "\\bget(ting)? fired\\b",
      "\\blose (my job|everything|them|it all)\\b",
      "\\bit('s| is) all over\\b",
      "\\bgo(es|ing)? wrong\\b",
      "\\bfail(ure|ed|ing|s)?\\b",
    ],
  },
];

export const PATTERN_LABELS: Record<PatternId, string> = Object.fromEntries(
  PATTERN_DEFINITIONS.map((definition) => [definition.id, definition.label]),
) as Record<PatternId, string>;

const COMPILED_PATTERNS = PATTERN_DEFINITIONS.map((definition) => ({
  definition,
  expressions: definition.terms.map((term) => new RegExp(term, "gi")),
}));

/* -------------------------------------------------------------------------- */
/* Shared text and time helpers (also used by trigger-detector.ts)            */
/* -------------------------------------------------------------------------- */

const MS_PER_DAY = 86_400_000;

/** Lower-cases and straightens curly quotes so "didn’t" matches "didn't". */
export function normaliseText(text: string): string {
  return text.toLowerCase().replace(/[\u2018\u2019]/g, "'").replace(/[\u201C\u201D]/g, '"');
}

/** Groups triggers that differ only by case, spacing or punctuation. */
export function normaliseTrigger(trigger: string | null | undefined): string {
  if (!trigger) return "";
  return normaliseText(trigger)
    .replace(/[^\p{L}\p{N}\s']/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function startOfUtcDayMs(date: Date): number {
  return Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());
}

function toDateOnly(ms: number): string {
  return new Date(ms).toISOString().slice(0, 10);
}

export interface TimelineBucket {
  /** First day of the bucket, YYYY-MM-DD (UTC). */
  start: string;
  count: number;
}

/**
 * Counts entries per 7-day bucket, oldest first, ending with the week that
 * contains today. `weeks` buckets are always returned, including empty ones, so
 * charts keep a stable shape.
 */
export function buildTimeline(createdAt: readonly string[], weeks: number, now: Date = new Date()): TimelineBucket[] {
  const today = startOfUtcDayMs(now);
  const buckets: TimelineBucket[] = [];

  for (let index = weeks - 1; index >= 0; index -= 1) {
    buckets.push({ start: toDateOnly(today - (index * 7 + 6) * MS_PER_DAY), count: 0 });
  }

  const firstStart = today - ((weeks - 1) * 7 + 6) * MS_PER_DAY;
  for (const iso of createdAt) {
    const time = new Date(iso).getTime();
    if (Number.isNaN(time)) continue;
    const day = startOfUtcDayMs(new Date(time));
    if (day < firstStart || day > today) continue;
    const bucketIndex = Math.floor((day - firstStart) / (7 * MS_PER_DAY));
    const bucket = buckets[bucketIndex];
    if (bucket) bucket.count += 1;
  }

  return buckets;
}

/** Weeks needed to cover a window, at least one. */
export function weeksForWindow(windowDays: number): number {
  return Math.max(1, Math.ceil(windowDays / 7));
}

export interface WindowSplit {
  current: DetectorThought[];
  previous: DetectorThought[];
}

/** Splits entries into the recent window and the equally long one before it. */
export function splitWindows(thoughts: readonly DetectorThought[], options: DetectorOptions): WindowSplit {
  const now = options.now ?? new Date();
  const today = startOfUtcDayMs(now);
  const currentStart = today - (options.windowDays - 1) * MS_PER_DAY;
  const previousStart = currentStart - options.windowDays * MS_PER_DAY;
  const tomorrow = today + MS_PER_DAY;

  const current: DetectorThought[] = [];
  const previous: DetectorThought[] = [];

  for (const thought of thoughts) {
    const time = new Date(thought.createdAt).getTime();
    if (Number.isNaN(time)) continue;
    if (time >= currentStart && time < tomorrow) current.push(thought);
    else if (time >= previousStart && time < currentStart) previous.push(thought);
  }

  return { current, previous };
}

/* -------------------------------------------------------------------------- */
/* Matching                                                                   */
/* -------------------------------------------------------------------------- */

export interface PatternMatch {
  id: PatternId;
  /** The exact words that matched, lower-cased and de-duplicated. */
  terms: string[];
}

/** Which patterns the words of one entry line up with, and which words did it. */
export function matchPatterns(text: string): PatternMatch[] {
  const haystack = normaliseText(text);
  const matches: PatternMatch[] = [];

  for (const { definition, expressions } of COMPILED_PATTERNS) {
    const found = new Set<string>();
    for (const expression of expressions) {
      const hits = haystack.match(expression);
      if (hits) for (const hit of hits) found.add(hit.trim());
    }
    if (found.size > 0) {
      // "keep replaying" already says "replaying": show only the longer phrase.
      const terms = [...found].filter((term) => ![...found].some((other) => other !== term && other.includes(term)));
      matches.push({ id: definition.id, terms });
    }
  }

  return matches;
}

/* -------------------------------------------------------------------------- */
/* Report                                                                     */
/* -------------------------------------------------------------------------- */

export type PatternTrend = "new" | "up" | "down" | "steady" | "insufficient";

export interface RelatedTrigger {
  label: string;
  count: number;
}

export interface RelatedThought {
  id: string;
  title: string;
}

export interface PatternSummary {
  id: PatternId;
  label: string;
  description: string;
  /** Entries in the recent window that line up with this pattern. */
  count: number;
  previousCount: number;
  /** Percentage of recent entries. One entry can appear in several patterns. */
  share: number;
  trend: PatternTrend;
  /** The words most often behind the match. */
  matchedTerms: string[];
  triggers: RelatedTrigger[];
  /** Newest first, capped. */
  thoughts: RelatedThought[];
  timeline: TimelineBucket[];
}

export type LoopReason = "circular_flag" | "repeated_trigger";

export interface LoopSummary {
  count: number;
  thoughtIds: string[];
  reasons: Record<string, LoopReason[]>;
}

export interface PatternReport {
  windowDays: number;
  /** Entries inside the recent window. */
  totalThoughts: number;
  /** Entries in the window before it: the baseline for trends. */
  previousTotal: number;
  patterns: PatternSummary[];
  /** For every entry passed in (both windows): which patterns matched. */
  thoughtPatterns: Record<string, PatternId[]>;
  loops: LoopSummary;
}

/** A trigger written this many times in the window counts as a loop. */
export const REPEATED_TRIGGER_THRESHOLD = 3;

const MAX_RELATED = 5;
const MAX_TERMS = 4;

function decideTrend(current: number, previous: number, previousTotal: number): PatternTrend {
  if (previousTotal === 0) return "insufficient";
  if (previous === 0 && current > 0) return "new";
  const delta = current - previous;
  if (delta >= 1 && current >= previous * 1.25) return "up";
  if (delta <= -1 && current <= previous * 0.75) return "down";
  return "steady";
}

function topEntries(counts: Map<string, number>, limit: number): [string, number][] {
  return [...counts.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])).slice(0, limit);
}

/**
 * "Loops detected" has a deliberately simple, explainable definition. An entry
 * counts as a loop when either:
 *  - the user marked it red (feels circular), or
 *  - its trigger was written on REPEATED_TRIGGER_THRESHOLD or more entries in the window.
 */
export function detectLoops(recent: readonly DetectorThought[]): LoopSummary {
  const reasons: Record<string, LoopReason[]> = {};
  const add = (id: string, reason: LoopReason) => {
    const list = reasons[id] ?? [];
    if (!list.includes(reason)) list.push(reason);
    reasons[id] = list;
  };

  const byTrigger = new Map<string, DetectorThought[]>();
  for (const thought of recent) {
    if (thought.trafficLight === "red") add(thought.id, "circular_flag");
    const key = normaliseTrigger(thought.trigger);
    if (!key) continue;
    const group = byTrigger.get(key) ?? [];
    group.push(thought);
    byTrigger.set(key, group);
  }

  for (const group of byTrigger.values()) {
    if (group.length >= REPEATED_TRIGGER_THRESHOLD) for (const thought of group) add(thought.id, "repeated_trigger");
  }

  const thoughtIds = Object.keys(reasons);
  return { count: thoughtIds.length, thoughtIds, reasons };
}

/**
 * The main entry point. Pass entries from at least the last `2 * windowDays`
 * days so the previous window is available for trends.
 */
export function detectPatterns(thoughts: readonly DetectorThought[], options: DetectorOptions): PatternReport {
  const now = options.now ?? new Date();
  const { current, previous } = splitWindows(thoughts, { ...options, now });

  const thoughtPatterns: Record<string, PatternId[]> = {};
  const matchesByThought = new Map<string, PatternMatch[]>();
  for (const thought of [...current, ...previous]) {
    const matches = matchPatterns(thought.text);
    matchesByThought.set(thought.id, matches);
    thoughtPatterns[thought.id] = matches.map((match) => match.id);
  }

  const weeks = weeksForWindow(options.windowDays);
  const patterns: PatternSummary[] = [];

  for (const definition of PATTERN_DEFINITIONS) {
    const linkedRecent = current.filter((thought) => thoughtPatterns[thought.id]?.includes(definition.id));
    if (linkedRecent.length === 0) continue;

    const previousCount = previous.filter((thought) => thoughtPatterns[thought.id]?.includes(definition.id)).length;

    const termCounts = new Map<string, number>();
    const triggerCounts = new Map<string, { label: string; count: number }>();

    for (const thought of linkedRecent) {
      const match = matchesByThought.get(thought.id)?.find((item) => item.id === definition.id);
      for (const term of match?.terms ?? []) termCounts.set(term, (termCounts.get(term) ?? 0) + 1);

      const key = normaliseTrigger(thought.trigger);
      if (key && thought.trigger) {
        const existing = triggerCounts.get(key);
        if (existing) existing.count += 1;
        else triggerCounts.set(key, { label: thought.trigger.trim(), count: 1 });
      }
    }

    const newestFirst = [...linkedRecent].sort((a, b) => b.createdAt.localeCompare(a.createdAt));

    patterns.push({
      id: definition.id,
      label: definition.label,
      description: definition.description,
      count: linkedRecent.length,
      previousCount,
      share: current.length > 0 ? Math.round((linkedRecent.length / current.length) * 100) : 0,
      trend: decideTrend(linkedRecent.length, previousCount, previous.length),
      matchedTerms: topEntries(termCounts, MAX_TERMS).map(([term]) => term),
      triggers: [...triggerCounts.values()].sort((a, b) => b.count - a.count).slice(0, 3),
      thoughts: newestFirst.slice(0, MAX_RELATED).map((thought) => ({ id: thought.id, title: thought.title })),
      timeline: buildTimeline(
        [...current, ...previous].filter((thought) => thoughtPatterns[thought.id]?.includes(definition.id)).map((t) => t.createdAt),
        weeks,
        now,
      ),
    });
  }

  patterns.sort((a, b) => b.count - a.count || a.label.localeCompare(b.label));

  return {
    windowDays: options.windowDays,
    totalThoughts: current.length,
    previousTotal: previous.length,
    patterns,
    thoughtPatterns,
    loops: detectLoops(current),
  };
}

/** Wording for a trend. Descriptive of the entries, never of the person. */
export function describeTrend(trend: PatternTrend): string {
  switch (trend) {
    case "up":
      return "More activity than the period before";
    case "down":
      return "Less activity than the period before";
    case "new":
      return "New this period";
    case "steady":
      return "About the same as before";
    case "insufficient":
      return "Not enough earlier entries to compare";
  }
}
