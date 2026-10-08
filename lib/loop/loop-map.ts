import { TRAFFIC_LIGHT_MAP, describeIntensity } from "@/lib/constants/thoughts";
import type { ThoughtCategory, TrafficLight } from "@/types";

/**
 * Turns one saved thought into the five nodes of the Thought Loop Map:
 * Trigger → Thought → Assumption → Emotion → Repeated Thinking (↺).
 *
 * Pure and serialisable: no icons, no JSX. The map component adds those. Every
 * line is built from what the user wrote or from simple counts of it.
 */

export type LoopNodeId = "trigger" | "thought" | "assumption" | "emotion" | "repeated";

export type LoopSection =
  | { kind: "text"; text: string; muted?: boolean }
  | { kind: "list"; title?: string; items: string[]; emptyText: string }
  | { kind: "bars"; title?: string; items: { label: string; value: number; caption: string }[] }
  | { kind: "chips"; title?: string; items: string[] }
  | { kind: "note"; title: string; text: string; tone: TrafficLight };

export interface LoopNodeData {
  id: LoopNodeId;
  label: string;
  /** One short line shown on the node itself. */
  summary: string;
  sections: LoopSection[];
}

export interface LoopMapInput {
  title: string;
  rawText: string;
  trigger: string | null;
  category: ThoughtCategory;
  trafficLight: TrafficLight;
  facts: string[];
  stories: string[];
  emotions: { emotion: string; intensity: number }[];
  /** Other entries that carry the same trigger. */
  sameTriggerCount: number;
  /** Labels of the patterns whose words appear in this entry. */
  patternLabels: string[];
}

function plural(count: number, one: string, many: string): string {
  return `${count} ${count === 1 ? one : many}`;
}

export function buildLoopNodes(input: LoopMapInput): LoopNodeData[] {
  const trigger = input.trigger?.trim() ?? "";
  const light = TRAFFIC_LIGHT_MAP[input.trafficLight];
  const strongest = [...input.emotions].sort((a, b) => b.intensity - a.intensity)[0];

  const triggerNode: LoopNodeData = {
    id: "trigger",
    label: "Trigger",
    summary: trigger || "No trigger noted",
    sections: [
      trigger
        ? { kind: "text", text: trigger }
        : { kind: "text", text: "You did not note what set this off. Editing the thought lets you add it.", muted: true },
      { kind: "chips", title: "Area of life", items: [input.category] },
    ],
  };

  const thoughtNode: LoopNodeData = {
    id: "thought",
    label: "Thought",
    summary: input.title,
    sections: [{ kind: "text", text: input.rawText }],
  };

  const assumptionNode: LoopNodeData = {
    id: "assumption",
    label: "Assumption",
    summary: input.stories.length > 0 ? plural(input.stories.length, "assumption", "assumptions") : "None recorded",
    sections: [
      {
        kind: "list",
        title: "What you were assuming, predicting or interpreting",
        items: input.stories,
        emptyText: "No assumptions recorded. If you notice one, Edit lets you add it.",
      },
      {
        kind: "list",
        title: "What you actually knew",
        items: input.facts,
        emptyText: "No facts recorded.",
      },
    ],
  };

  const emotionNode: LoopNodeData = {
    id: "emotion",
    label: "Emotion",
    summary: strongest ? `${strongest.emotion}, ${strongest.intensity}/10` : "None recorded",
    sections:
      input.emotions.length > 0
        ? [
            {
              kind: "bars",
              title: "How it felt, in your words",
              items: [...input.emotions]
                .sort((a, b) => b.intensity - a.intensity)
                .map((item) => ({
                  label: item.emotion,
                  value: item.intensity,
                  caption: `${item.intensity} / 10, ${describeIntensity(item.intensity)}`,
                })),
            },
          ]
        : [{ kind: "text", text: "No feelings recorded for this thought.", muted: true }],
  };

  const repeatedSections: LoopSection[] = [
    { kind: "note", title: light.label, text: light.explanation, tone: input.trafficLight },
    {
      kind: "text",
      text:
        input.facts.length === 0
          ? `You wrote down ${plural(input.stories.length, "assumption", "assumptions")} and no facts. Adding one fact is often the quickest way to slow a loop.`
          : `You wrote down ${plural(input.stories.length, "assumption", "assumptions")} alongside ${plural(input.facts.length, "fact", "facts")}.`,
    },
  ];

  if (input.patternLabels.length > 0) {
    repeatedSections.push({
      kind: "chips",
      title: "Words in this entry overlap with",
      items: input.patternLabels,
    });
  }

  if (input.sameTriggerCount > 0) {
    repeatedSections.push({
      kind: "text",
      text: `${plural(input.sameTriggerCount, "other entry carries", "other entries carry")} the same trigger.`,
    });
  }

  const repeatedNode: LoopNodeData = {
    id: "repeated",
    label: "Repeated thinking",
    summary: input.sameTriggerCount > 0 ? `${light.label}, seen ${input.sameTriggerCount + 1} times` : light.label,
    sections: repeatedSections,
  };

  return [triggerNode, thoughtNode, assumptionNode, emotionNode, repeatedNode];
}
