import type { ThoughtDraft } from "@/lib/thoughts/draft";
import type { ActionPriority, ControlType, ThoughtCategory, ThoughtDetail, TrafficLight } from "@/types";

/**
 * One shape that both the review screen (an unsaved draft) and the detail page
 * (a saved row) can render, so the summary markup exists only once.
 */
export interface ThoughtSummaryData {
  title: string;
  rawText: string;
  trigger: string | null;
  category: ThoughtCategory;
  trafficLight: TrafficLight;
  facts: string[];
  stories: string[];
  emotions: { id: string; emotion: string; intensity: number }[];
  controlItems: { id: string; content: string; controlType: ControlType }[];
  action: { title: string; priority: ActionPriority; dueDate: string | null } | null;
}

/** Only called once a draft has passed thoughtDraftSchema, so the unions are set. */
export function summaryFromDraft(draft: ThoughtDraft): ThoughtSummaryData {
  return {
    title: draft.title.trim(),
    rawText: draft.rawText.trim(),
    trigger: draft.trigger.trim() || null,
    category: (draft.category || "Other") as ThoughtCategory,
    trafficLight: (draft.trafficLight || "yellow") as TrafficLight,
    facts: draft.facts.map((item) => item.content),
    stories: draft.stories.map((item) => item.content),
    emotions: draft.emotions.map((item) => ({
      id: item.id,
      emotion: item.emotion,
      intensity: item.intensity,
    })),
    controlItems: draft.controlItems.map((item) => ({
      id: item.id,
      content: item.content,
      controlType: item.controlType,
    })),
    action: draft.action.title.trim()
      ? {
          title: draft.action.title.trim(),
          priority: draft.action.priority,
          dueDate: draft.action.dueDate || null,
        }
      : null,
  };
}

export function summaryFromDetail(detail: ThoughtDetail): ThoughtSummaryData {
  return {
    title: detail.title,
    rawText: detail.raw_text,
    trigger: detail.trigger,
    category: detail.category,
    trafficLight: detail.traffic_light,
    facts: detail.facts.map((fact) => fact.content),
    stories: detail.stories.map((story) => story.content),
    emotions: detail.emotions.map((row) => ({ id: row.id, emotion: row.emotion, intensity: row.intensity })),
    controlItems: detail.controlItems.map((item) => ({
      id: item.id,
      content: item.content,
      controlType: item.control_type,
    })),
    action: null,
  };
}
