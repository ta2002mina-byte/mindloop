/**
 * Hidden Trigger Detector.
 *
 * Surfaces contexts that keep coming back across a user's OWN entries. It reads
 * only what is passed in (already fetched from the user's rows), so it can never
 * invent a trigger the user did not write about.
 *
 * Two kinds of result:
 *  - "recurring": the exact same trigger text was noted several times.
 *  - "context":   a broader theme (for example uncertainty or deadlines) shows
 *                 up in the words of several entries. The matched words are
 *                 returned so the UI can show what the theme is based on.
 *
 * Like pattern-detector.ts this is pure TypeScript, easy to test and to replace.
 */
import {
  PATTERN_LABELS,
  buildTimeline,
  normaliseText,
  normaliseTrigger,
  splitWindows,
  weeksForWindow,
  type DetectorOptions,
  type DetectorThought,
  type PatternId,
  type RelatedThought,
  type TimelineBucket,
} from "@/lib/pattern-detector";

export type TriggerKind = "recurring" | "context";

export interface RelatedPattern {
  id: PatternId;
  label: string;
  count: number;
}

export interface TriggerSummary {
  /** Stable key for React lists. */
  key: string;
  kind: TriggerKind;
  label: string;
  /** Entries in the recent window that carry it. */
  count: number;
  /** For contexts: the words that matched. Empty for recurring triggers. */
  matchedTerms: string[];
  relatedPatterns: RelatedPattern[];
  /** Newest first, capped. */
  thoughts: RelatedThought[];
  timeline: TimelineBucket[];
  /** A single sentence in the "your recent entries" voice. */
  blurb: string;
}

export interface TriggerReport {
  recurring: TriggerSummary[];
  contexts: TriggerSummary[];
}

/* -------------------------------------------------------------------------- */
/* Context themes                                                             */
/* -------------------------------------------------------------------------- */

interface ContextDefinition {
  id: string;
  label: string;
  terms: readonly string[];
}

/** Edit this list to tune which contexts are looked for. */
export const CONTEXT_DEFINITIONS: readonly ContextDefinition[] = [
  {
    id: "uncertainty",
    label: "Uncertainty",
    terms: [
      "\\bnot sure\\b",
      "\\bunsure\\b",
      "\\bunclear\\b",
      "\\buncertain(ty)?\\b",
      "\\bdon't know\\b",
      "\\bno idea\\b",
      "\\bwaiting (to hear|for (a|an|the|their|his|her) (reply|answer|response|result|results|news))\\b",
      "\\bhaven't (heard|been told)\\b",
      "\\bunknown\\b",
      "\\bin limbo\\b",
    ],
  },
  {
    id: "being_evaluated",
    label: "Being evaluated",
    terms: [
      "\\bexam(s)?\\b",
      "\\binterview\\b",
      "\\bpresentation\\b",
      "\\bfeedback\\b",
      "\\breview\\b",
      "\\bperformance\\b",
      "\\bgrades?\\b",
      "\\bresults?\\b",
      "\\bassessment\\b",
    ],
  },
  {
    id: "time_pressure",
    label: "Time pressure",
    terms: [
      "\\bdeadline(s)?\\b",
      "\\bdue (today|tomorrow|soon|on|by)\\b",
      "\\brunning out of time\\b",
      "\\bnot enough time\\b",
      "\\brushed\\b",
      "\\bbehind (on|schedule)\\b",
      "\\burgent\\b",
      "\\blate\\b",
    ],
  },
  {
    id: "disagreement",
    label: "Disagreement or tension",
    terms: [
      "\\bargu(e|ed|ing|ment)\\b",
      "\\bfight\\b",
      "\\bdisagree(d|ment)?\\b",
      "\\bconflict\\b",
      "\\btension\\b",
      "\\bsnapped\\b",
      "\\bawkward\\b",
    ],
  },
  {
    id: "change",
    label: "Change or transition",
    terms: [
      "\\bmoving (to|out|away|house)\\b",
      "\\bnew (job|city|school|team|manager|role)\\b",
      "\\btransition\\b",
      "\\bstarting (a|my|the) \\w+",
      "\\bleaving\\b",
      "\\bchanges?\\b",
    ],
  },
  {
    id: "money_pressure",
    label: "Money pressure",
    terms: ["\\brent\\b", "\\bbills?\\b", "\\bsalary\\b", "\\bdebt\\b", "\\bafford\\b", "\\bexpensive\\b", "\\bbudget\\b"],
  },
  {
    id: "being_left_out",
    label: "Feeling left out",
    terms: [
      "\\bleft out\\b",
      "\\bexcluded\\b",
      "\\bnot invited\\b",
      "\\bignored\\b",
      "\\bleft me on (read|seen)\\b",
      "\\bwithout me\\b",
    ],
  },
];

const COMPILED_CONTEXTS = CONTEXT_DEFINITIONS.map((definition) => ({
  definition,
  expressions: definition.terms.map((term) => new RegExp(term, "gi")),
}));

/** A context or trigger needs at least this many recent entries before it is shown. */
export const MIN_OCCURRENCES = 2;

/** From this many entries the wording moves from "a few" to "frequently". */
const FREQUENT_AT = 3;

const MAX_RELATED = 5;
const MAX_TERMS = 4;

/* -------------------------------------------------------------------------- */

function relatedPatternsFor(
  group: readonly DetectorThought[],
  thoughtPatterns: Readonly<Record<string, readonly PatternId[]>>,
): RelatedPattern[] {
  const counts = new Map<PatternId, number>();
  for (const thought of group) {
    for (const id of thoughtPatterns[thought.id] ?? []) counts.set(id, (counts.get(id) ?? 0) + 1);
  }
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1] || PATTERN_LABELS[a[0]].localeCompare(PATTERN_LABELS[b[0]]))
    .slice(0, 3)
    .map(([id, count]) => ({ id, label: PATTERN_LABELS[id], count }));
}

function newestFirst(group: readonly DetectorThought[]): RelatedThought[] {
  return [...group]
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, MAX_RELATED)
    .map((thought) => ({ id: thought.id, title: thought.title }));
}

export function detectTriggers(
  thoughts: readonly DetectorThought[],
  thoughtPatterns: Readonly<Record<string, readonly PatternId[]>>,
  options: DetectorOptions,
): TriggerReport {
  const now = options.now ?? new Date();
  const { current, previous } = splitWindows(thoughts, { ...options, now });
  const weeks = weeksForWindow(options.windowDays);
  const timelineSource = [...current, ...previous];

  /* Recurring, exact triggers ------------------------------------------------ */
  const byTrigger = new Map<string, { label: string; recent: DetectorThought[] }>();
  for (const thought of current) {
    const key = normaliseTrigger(thought.trigger);
    if (!key || !thought.trigger) continue;
    const group = byTrigger.get(key) ?? { label: thought.trigger.trim(), recent: [] };
    group.recent.push(thought);
    byTrigger.set(key, group);
  }

  const recurring: TriggerSummary[] = [];
  for (const [key, group] of byTrigger) {
    if (group.recent.length < MIN_OCCURRENCES) continue;
    const earlier = timelineSource.filter((thought) => normaliseTrigger(thought.trigger) === key);

    recurring.push({
      key: `trigger:${key}`,
      kind: "recurring",
      label: group.label,
      count: group.recent.length,
      matchedTerms: [],
      relatedPatterns: relatedPatternsFor(group.recent, thoughtPatterns),
      thoughts: newestFirst(group.recent),
      timeline: buildTimeline(
        earlier.map((thought) => thought.createdAt),
        weeks,
        now,
      ),
      blurb: `You noted this trigger on ${group.recent.length} recent entries.`,
    });
  }
  recurring.sort((a, b) => b.count - a.count || a.label.localeCompare(b.label));

  /* Broader contexts, from the words of the entries -------------------------- */
  const contexts: TriggerSummary[] = [];
  for (const { definition, expressions } of COMPILED_CONTEXTS) {
    const linked: DetectorThought[] = [];
    const termCounts = new Map<string, number>();

    for (const thought of current) {
      const haystack = normaliseText(`${thought.trigger ?? ""} ${thought.text}`);
      let hit = false;
      for (const expression of expressions) {
        const found = haystack.match(expression);
        if (!found) continue;
        hit = true;
        for (const term of new Set(found.map((item) => item.trim()))) {
          termCounts.set(term, (termCounts.get(term) ?? 0) + 1);
        }
      }
      if (hit) linked.push(thought);
    }

    if (linked.length < MIN_OCCURRENCES) continue;

    const linkedIds = new Set(linked.map((thought) => thought.id));
    const earlier = timelineSource.filter((thought) => {
      if (linkedIds.has(thought.id)) return true;
      if (current.includes(thought)) return false;
      const haystack = normaliseText(`${thought.trigger ?? ""} ${thought.text}`);
      return COMPILED_CONTEXTS.find((item) => item.definition.id === definition.id)?.expressions.some((expression) => {
        expression.lastIndex = 0;
        return expression.test(haystack);
      });
    });

    contexts.push({
      key: `context:${definition.id}`,
      kind: "context",
      label: definition.label,
      count: linked.length,
      matchedTerms: [...termCounts.entries()]
        .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
        .slice(0, MAX_TERMS)
        .map(([term]) => term),
      relatedPatterns: relatedPatternsFor(linked, thoughtPatterns),
      thoughts: newestFirst(linked),
      timeline: buildTimeline(
        earlier.map((thought) => thought.createdAt),
        weeks,
        now,
      ),
      blurb:
        linked.length >= FREQUENT_AT
          ? `${definition.label} appears frequently in your recent entries.`
          : `${definition.label} shows up in a few of your recent entries.`,
    });
  }
  contexts.sort((a, b) => b.count - a.count || a.label.localeCompare(b.label));

  return { recurring, contexts };
}
