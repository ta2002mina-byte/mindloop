import type {
  ActionPriorityValue,
  ControlTypeValue,
  Database,
  PredictionOutcomeValue,
  ThoughtCategory,
  ThoughtStatus,
  TrafficLightValue,
} from "@/types/database";

type Tables = Database["public"]["Tables"];

export type Profile = Tables["profiles"]["Row"];

/** The minimal user shape the UI needs. Never pass the raw Supabase user to client components. */
export interface AppUser {
  id: string;
  email: string;
  fullName: string | null;
  avatarUrl: string | null;
}

export type TrafficLight = TrafficLightValue;
export type {
  ThoughtCategory,
  ThoughtStatus,
  ControlTypeValue as ControlType,
  ActionPriorityValue as ActionPriority,
  PredictionOutcomeValue as PredictionOutcome,
};

/* -------------------------------------------------------------------------- */
/* Thought Lab                                                                */
/* -------------------------------------------------------------------------- */

export type ThoughtRow = Tables["thoughts"]["Row"];
export type ThoughtFactRow = Tables["thought_facts"]["Row"];
export type ThoughtStoryRow = Tables["thought_stories"]["Row"];
export type EmotionRow = Tables["emotions"]["Row"];
export type ControlItemRow = Tables["control_items"]["Row"];
export type ActionRow = Tables["actions"]["Row"];

/** A thought plus the one action shown on its card in the list. */
export interface ThoughtListItem extends ThoughtRow {
  nextAction: ActionRow | null;
}

/** Everything the detail page and the review screen need. */
export interface ThoughtDetail extends ThoughtRow {
  facts: ThoughtFactRow[];
  stories: ThoughtStoryRow[];
  emotions: EmotionRow[];
  controlItems: ControlItemRow[];
  actions: ActionRow[];
}

/** The discriminated result every Server Action returns. */
export type ActionResult<TData = undefined> =
  | { ok: true; data: TData }
  | { ok: false; message: string };

/* -------------------------------------------------------------------------- */
/* Phase 3: predictions and worry capsules                                    */
/* -------------------------------------------------------------------------- */

export type PredictionRow = Tables["predictions"]["Row"];
export type WorryCapsuleRow = Tables["worry_capsules"]["Row"];

/** Id and title only: enough for a "which thought is this about?" picker. */
export interface ThoughtOption {
  id: string;
  title: string;
}

/** waiting: the date has not arrived. ready: it has, and no review yet. reviewed: compared with reality. */
export type PredictionStage = "waiting" | "ready" | "reviewed";

export interface PredictionView extends PredictionRow {
  thoughtTitle: string;
  stage: PredictionStage;
}

/** locked: sealed until reopen_date. ready: the date has arrived. reopened: then-vs-now is recorded. */
export type CapsuleStage = "locked" | "ready" | "reopened";

/**
 * What the browser is allowed to know about a capsule. For a locked capsule the
 * original text and intensity are null: the server never sends them.
 */
export interface CapsuleView {
  id: string;
  thoughtId: string;
  thoughtTitle: string;
  reopenDate: string;
  createdAt: string;
  stage: CapsuleStage;
  thoughtText: string | null;
  worryIntensity: number | null;
  reopenedAt: string | null;
  currentIntensity: number | null;
  outcome: string | null;
  whatChanged: string | null;
}

/* -------------------------------------------------------------------------- */
/* Phase 4: Decision Room, AI and Insights                                    */
/* -------------------------------------------------------------------------- */

export type DecisionRoomRow = Tables["decision_rooms"]["Row"];
export type DecisionOptionRow = Tables["decision_options"]["Row"];
export type ReflectionRow = Tables["reflections"]["Row"];

/** A room plus its options, ordered by position. */
export interface DecisionRoomDetail extends DecisionRoomRow {
  options: DecisionOptionRow[];
}

/** Enough for a card in the rooms list. */
export interface DecisionRoomListItem extends DecisionRoomRow {
  optionCount: number;
  /** Names in column order, for the preview line. */
  optionNames: string[];
  /** How many options already have a first step written. */
  firstStepCount: number;
}
