import { z } from "zod";

import {
  ACTION_PRIORITIES,
  THOUGHT_CATEGORIES,
  THOUGHT_STATUSES,
} from "@/lib/constants/thoughts";
import type { ActionPriority, ThoughtCategory, ThoughtStatus } from "@/types";

/** zod needs a non-empty tuple for z.enum, so the readonly arrays are re-cast once here. */
const categoryValues = THOUGHT_CATEGORIES as unknown as [ThoughtCategory, ...ThoughtCategory[]];
const priorityValues = ACTION_PRIORITIES as unknown as [ActionPriority, ...ActionPriority[]];
const statusValues = THOUGHT_STATUSES as unknown as [ThoughtStatus, ...ThoughtStatus[]];

export const trafficLightSchema = z.enum(["green", "yellow", "red"]);
export const controlTypeSchema = z.enum(["control", "influence", "cannot_control"]);
export const thoughtStatusSchema = z.enum(statusValues);

const listItemSchema = z.object({
  id: z.string().min(1),
  content: z.string().trim().min(3, "Write at least a few words.").max(500, "Use 500 characters or fewer."),
});

const emotionSchema = z.object({
  id: z.string().min(1),
  emotion: z.string().trim().min(1, "Name the feeling.").max(40, "Use 40 characters or fewer."),
  intensity: z.number().int().min(1).max(10),
  isCustom: z.boolean(),
});

const controlItemSchema = z.object({
  id: z.string().min(1),
  content: z.string().trim().min(3, "Write at least a few words.").max(300, "Use 300 characters or fewer."),
  controlType: controlTypeSchema,
});

/** YYYY-MM-DD, the value an <input type="date"> produces. */
const dateOnlySchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Use a valid date.")
  .refine((value) => !Number.isNaN(new Date(`${value}T00:00:00`).getTime()), "Use a valid date.");

/* Per-step schemas: the wizard validates one step at a time. -------------- */

export const situationStepSchema = z.object({
  category: z.enum(categoryValues, { errorMap: () => ({ message: "Pick the area this belongs to." }) }),
  trigger: z.string().trim().max(200, "Use 200 characters or fewer."),
});

export const thoughtStepSchema = z.object({
  rawText: z
    .string()
    .trim()
    .min(10, "Write a little more, so there is something to work with.")
    .max(5000, "Use 5000 characters or fewer."),
  title: z.string().trim().min(3, "Give this a short title.").max(120, "Use 120 characters or fewer."),
});

export const factStoryStepSchema = z
  .object({
    facts: z.array(listItemSchema),
    stories: z.array(listItemSchema),
  })
  .refine((value) => value.facts.length + value.stories.length > 0, {
    path: ["facts"],
    message: "Add at least one fact or one story.",
  });

export const emotionStepSchema = z.object({
  emotions: z.array(emotionSchema).min(1, "Pick at least one feeling."),
});

export const controlStepSchema = z.object({
  controlItems: z.array(controlItemSchema).min(1, "Add at least one item to any column."),
});

export const trafficLightStepSchema = z.object({
  trafficLight: trafficLightSchema,
});

export const actionStepSchema = z
  .object({
    title: z.string().trim().max(200, "Use 200 characters or fewer."),
    priority: z.enum(priorityValues),
    dueDate: z.union([dateOnlySchema, z.literal("")]),
  })
  .refine((value) => value.title.length === 0 || value.title.length >= 3, {
    path: ["title"],
    message: "Write at least a few words, or leave it empty for now.",
  })
  .refine((value) => value.title.length > 0 || value.dueDate.length === 0, {
    path: ["title"],
    message: "Describe the action, or clear the due date.",
  });

/* The full payload a Server Action accepts. ------------------------------- */

export const thoughtDraftSchema = z.object({
  trigger: situationStepSchema.shape.trigger,
  category: situationStepSchema.shape.category,
  rawText: thoughtStepSchema.shape.rawText,
  title: thoughtStepSchema.shape.title,
  facts: z.array(listItemSchema).max(20, "That is a lot of facts. Keep the clearest 20."),
  stories: z.array(listItemSchema).max(20, "That is a lot of stories. Keep the clearest 20."),
  emotions: z.array(emotionSchema).min(1, "Pick at least one feeling.").max(10),
  controlItems: z.array(controlItemSchema).min(1, "Add at least one item to any column.").max(30),
  trafficLight: trafficLightSchema,
  action: z.object({
    title: z.string().trim().max(200),
    priority: z.enum(priorityValues),
    dueDate: z.union([dateOnlySchema, z.literal("")]),
  }),
});

export type ThoughtDraftInput = z.infer<typeof thoughtDraftSchema>;
export type ActionStepValues = z.infer<typeof actionStepSchema>;
