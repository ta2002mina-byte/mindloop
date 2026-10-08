import { z } from "zod";

import { PREDICTION_OUTCOMES } from "@/lib/constants/phase3";
import type { PredictionOutcome } from "@/types";

const outcomeValues = PREDICTION_OUTCOMES.map((item) => item.value) as [PredictionOutcome, ...PredictionOutcome[]];

/** YYYY-MM-DD, the value an <input type="date"> produces. */
export const dateOnlySchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Use a valid date.")
  .refine((value) => !Number.isNaN(new Date(`${value}T00:00:00Z`).getTime()), "Use a valid date.");

export const createPredictionSchema = z.object({
  thoughtId: z.string().uuid("Pick the thought this prediction belongs to."),
  predictionText: z
    .string()
    .trim()
    .min(5, "Write a little more, so there is something to compare later.")
    .max(500, "Use 500 characters or fewer."),
  confidence: z.number().int("Pick a whole number.").min(0).max(100),
  expectedDate: dateOnlySchema,
});

export const reviewPredictionSchema = z.object({
  id: z.string().uuid(),
  outcomeRating: z.enum(outcomeValues, { errorMap: () => ({ message: "Pick what best matches how it went." }) }),
  outcome: z.string().trim().max(500, "Use 500 characters or fewer."),
});

export type CreatePredictionInput = z.infer<typeof createPredictionSchema>;
export type ReviewPredictionInput = z.infer<typeof reviewPredictionSchema>;
