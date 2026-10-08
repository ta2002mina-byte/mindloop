import type { ActionPriority, ControlType, ThoughtCategory, ThoughtStatus, TrafficLight } from "@/types";

/* Categories ---------------------------------------------------------------- */

export const THOUGHT_CATEGORIES: readonly ThoughtCategory[] = [
  "Work",
  "Study",
  "Relationships",
  "Social",
  "Decisions",
  "Future",
  "Family",
  "Money",
  "Other",
];

export function isThoughtCategory(value: string): value is ThoughtCategory {
  return (THOUGHT_CATEGORIES as readonly string[]).includes(value);
}

/* Status -------------------------------------------------------------------- */

export const THOUGHT_STATUSES: readonly ThoughtStatus[] = ["active", "resolved", "archived"];

export const STATUS_LABELS: Record<ThoughtStatus, string> = {
  active: "Active",
  resolved: "Resolved",
  archived: "Archived",
};

export function isThoughtStatus(value: string): value is ThoughtStatus {
  return (THOUGHT_STATUSES as readonly string[]).includes(value);
}

/* Traffic light ------------------------------------------------------------- */

export interface TrafficLightMeta {
  value: TrafficLight;
  /** Short label used in badges. */
  label: string;
  /** The one-line meaning shown next to the choice. */
  summary: string;
  /** The explanation shown once a state is selected. */
  explanation: string;
  dot: string;
  text: string;
  border: string;
  tint: string;
}

/**
 * Wording is deliberately descriptive, never diagnostic: these describe what a
 * single entry looks like, not the person who wrote it.
 */
export const TRAFFIC_LIGHTS: readonly TrafficLightMeta[] = [
  {
    value: "green",
    label: "Action possible",
    summary: "There is something I can actually do.",
    explanation:
      "You have enough to move on something small. Put that step in the next screen, however minor it looks.",
    dot: "bg-emerald-500",
    text: "text-emerald-700 dark:text-emerald-300",
    border: "border-emerald-500/60",
    tint: "bg-emerald-500/10",
  },
  {
    value: "yellow",
    label: "More info useful",
    summary: "More information would help before deciding.",
    explanation:
      "Something is still unknown. A useful next step is often a question to ask or a fact to check, rather than a decision.",
    dot: "bg-amber-500",
    text: "text-amber-700 dark:text-amber-300",
    border: "border-amber-500/60",
    tint: "bg-amber-500/10",
  },
  {
    value: "red",
    label: "Feels circular",
    summary: "This thought keeps repeating without moving.",
    explanation:
      "The same thought appears to be looping. This is a note about the thought, not about you. A tiny action, or parking it for a set time, usually helps more than more thinking.",
    dot: "bg-rose-500",
    text: "text-rose-700 dark:text-rose-300",
    border: "border-rose-500/60",
    tint: "bg-rose-500/10",
  },
];

export const TRAFFIC_LIGHT_MAP: Record<TrafficLight, TrafficLightMeta> = {
  green: TRAFFIC_LIGHTS[0]!,
  yellow: TRAFFIC_LIGHTS[1]!,
  red: TRAFFIC_LIGHTS[2]!,
};

export function isTrafficLight(value: string): value is TrafficLight {
  return value === "green" || value === "yellow" || value === "red";
}

/* Emotions ------------------------------------------------------------------ */

export const EMOTION_OPTIONS: readonly string[] = [
  "Worried",
  "Confused",
  "Frustrated",
  "Sad",
  "Embarrassed",
  "Angry",
  "Nervous",
  "Overwhelmed",
];

export const OTHER_EMOTION = "Other";

/** Plain-language intensity anchors. No clinical scale is implied. */
export function describeIntensity(intensity: number): string {
  if (intensity <= 3) return "Mild";
  if (intensity <= 6) return "Noticeable";
  if (intensity <= 8) return "Strong";
  return "Very strong";
}

/* Control map --------------------------------------------------------------- */

export interface ControlColumnMeta {
  value: ControlType;
  title: string;
  hint: string;
  placeholder: string;
  accent: string;
}

export const CONTROL_COLUMNS: readonly ControlColumnMeta[] = [
  {
    value: "control",
    title: "I can control",
    hint: "Things that are fully your call.",
    placeholder: "e.g. Sending the email today",
    accent: "border-emerald-500/40",
  },
  {
    value: "influence",
    title: "I can influence",
    hint: "Things you can affect, but not decide.",
    placeholder: "e.g. How clearly I explain the delay",
    accent: "border-amber-500/40",
  },
  {
    value: "cannot_control",
    title: "I cannot control",
    hint: "Things that belong to other people or to time.",
    placeholder: "e.g. How they react",
    accent: "border-slate-400/40",
  },
];

export const CONTROL_TYPE_LABELS: Record<ControlType, string> = {
  control: "I can control",
  influence: "I can influence",
  cannot_control: "I cannot control",
};

/* Actions ------------------------------------------------------------------- */

export const ACTION_PRIORITIES: readonly ActionPriority[] = ["low", "medium", "high"];

export const PRIORITY_LABELS: Record<ActionPriority, string> = {
  low: "Low",
  medium: "Medium",
  high: "High",
};

export function isActionPriority(value: string): value is ActionPriority {
  return value === "low" || value === "medium" || value === "high";
}

/* List page ----------------------------------------------------------------- */

export const THOUGHTS_PAGE_SIZE = 9;
