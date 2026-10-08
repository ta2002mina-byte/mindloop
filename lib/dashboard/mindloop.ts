import type { PatternReport, PatternSummary } from "@/lib/pattern-detector";
import type { TriggerReport } from "@/lib/trigger-detector";
import type { ActionPriority, TrafficLight } from "@/types";

/** One node of the "Your MindLoop" dashboard widget. `value` is null when there is nothing real to show yet. */
export interface MindLoopNode {
  value: string | null;
  /** Small supporting line, for example "noted on 3 entries". */
  detail: string | null;
  href: string | null;
}

export interface MindLoopSummary {
  trigger: MindLoopNode;
  thought: MindLoopNode;
  pattern: MindLoopNode;
  action: MindLoopNode;
  /** True once at least one node has real data behind it. */
  hasData: boolean;
}

export interface MindLoopInputs {
  patterns: PatternReport;
  triggers: TriggerReport;
  recentThoughts: { id: string; title: string; trafficLight: TrafficLight; trigger: string | null }[];
  todayAction: { title: string; thoughtId: string; priority: ActionPriority } | null;
  thoughtHref: (id: string) => string;
  patternsHref: string;
}

/**
 * Picks ONE real item for each stage of Trigger → Thought → Pattern → Action.
 * Nothing here is invented: an empty stage stays empty and the widget says so.
 */
export function buildMindLoopSummary(inputs: MindLoopInputs): MindLoopSummary {
  const { patterns, triggers, recentThoughts, todayAction } = inputs;

  const topRecurring = triggers.recurring[0];
  const topContext = triggers.contexts[0];
  const latestWithTrigger = recentThoughts.find((thought) => thought.trigger?.trim());

  const trigger: MindLoopNode = topRecurring
    ? { value: topRecurring.label, detail: `noted on ${topRecurring.count} recent entries`, href: inputs.patternsHref }
    : topContext
      ? { value: topContext.label, detail: `in ${topContext.count} recent entries`, href: inputs.patternsHref }
      : latestWithTrigger?.trigger
        ? { value: latestWithTrigger.trigger.trim(), detail: "from your latest entry", href: inputs.thoughtHref(latestWithTrigger.id) }
        : { value: null, detail: null, href: null };

  // Prefer an entry that is part of a detected loop, since that is the one to look at.
  const loopIds = new Set(patterns.loops.thoughtIds);
  const focus = recentThoughts.find((thought) => loopIds.has(thought.id)) ?? recentThoughts[0];
  const thought: MindLoopNode = focus
    ? {
        value: focus.title,
        detail: loopIds.has(focus.id) ? "part of a repeating loop" : "your latest entry",
        href: inputs.thoughtHref(focus.id),
      }
    : { value: null, detail: null, href: null };

  const topPattern: PatternSummary | undefined = patterns.patterns[0];
  const pattern: MindLoopNode = topPattern
    ? { value: topPattern.label, detail: `${topPattern.count} of ${patterns.totalThoughts} recent entries`, href: inputs.patternsHref }
    : { value: null, detail: null, href: null };

  const action: MindLoopNode = todayAction
    ? { value: todayAction.title, detail: `${todayAction.priority} priority`, href: inputs.thoughtHref(todayAction.thoughtId) }
    : { value: null, detail: null, href: null };

  return {
    trigger,
    thought,
    pattern,
    action,
    hasData: [trigger, thought, pattern, action].some((node) => node.value !== null),
  };
}
