import { OTHER_EMOTION } from "@/lib/constants/thoughts";
import type { ActionPriority, ControlType, ThoughtCategory, ThoughtDetail, TrafficLight } from "@/types";

/**
 * The shape the wizard edits. It is deliberately flat and serialisable so it can
 * be kept in local storage between steps and posted to a Server Action as-is.
 *
 * `category` and `trafficLight` allow "" only because nothing is chosen yet;
 * thoughtDraftSchema rejects "" before anything reaches the database.
 */
export interface DraftListItem {
  id: string;
  content: string;
}

export interface DraftEmotion {
  id: string;
  emotion: string;
  intensity: number;
  /** True for a feeling the user typed themselves via "Other". */
  isCustom: boolean;
}

export interface DraftControlItem {
  id: string;
  content: string;
  controlType: ControlType;
}

export interface DraftAction {
  title: string;
  priority: ActionPriority;
  /** YYYY-MM-DD or "" for no due date. */
  dueDate: string;
}

export interface ThoughtDraft {
  trigger: string;
  category: ThoughtCategory | "";
  rawText: string;
  title: string;
  facts: DraftListItem[];
  stories: DraftListItem[];
  emotions: DraftEmotion[];
  controlItems: DraftControlItem[];
  trafficLight: TrafficLight | "";
  action: DraftAction;
}

/** Client-side only ids, used as React keys and to target one row for edit/remove. */
export function draftItemId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `item-${Math.random().toString(36).slice(2)}-${Date.now()}`;
}

export function createEmptyDraft(): ThoughtDraft {
  return {
    trigger: "",
    category: "",
    rawText: "",
    title: "",
    facts: [],
    stories: [],
    emotions: [],
    controlItems: [],
    trafficLight: "",
    action: { title: "", priority: "medium", dueDate: "" },
  };
}

/** Turns a saved thought back into an editable draft. */
export function draftFromDetail(detail: ThoughtDetail): ThoughtDraft {
  const openAction = detail.actions.find((action) => !action.completed) ?? detail.actions[0] ?? null;
  return {
    trigger: detail.trigger ?? "",
    category: detail.category,
    rawText: detail.raw_text,
    title: detail.title,
    facts: detail.facts.map((fact) => ({ id: fact.id, content: fact.content })),
    stories: detail.stories.map((story) => ({ id: story.id, content: story.content })),
    emotions: detail.emotions.map((row) => ({
      id: row.id,
      emotion: row.emotion,
      intensity: row.intensity,
      isCustom: !isPresetEmotion(row.emotion),
    })),
    controlItems: detail.controlItems.map((item) => ({
      id: item.id,
      content: item.content,
      controlType: item.control_type,
    })),
    trafficLight: detail.traffic_light,
    action: openAction
      ? {
          title: openAction.title,
          priority: openAction.priority,
          dueDate: openAction.due_date ?? "",
        }
      : { title: "", priority: "medium", dueDate: "" },
  };
}

const PRESET_EMOTIONS = new Set([
  "Worried",
  "Confused",
  "Frustrated",
  "Sad",
  "Embarrassed",
  "Angry",
  "Nervous",
  "Overwhelmed",
]);

export function isPresetEmotion(emotion: string): boolean {
  return PRESET_EMOTIONS.has(emotion) && emotion !== OTHER_EMOTION;
}
