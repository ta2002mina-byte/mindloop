import { z } from "zod";

import { REOPEN_PRESETS, type ReopenPreset } from "@/lib/constants/phase3";
import { dateOnlySchema } from "@/lib/validations/prediction";

const presetValues = REOPEN_PRESETS.map((item) => item.value) as [ReopenPreset, ...ReopenPreset[]];

const intensitySchema = z.number().int("Pick a whole number.").min(1, "Pick 1 to 10.").max(10, "Pick 1 to 10.");

export const createCapsuleSchema = z
  .object({
    thoughtId: z.string().uuid("Pick the thought to seal."),
    worryIntensity: intensitySchema,
    preset: z.enum(presetValues),
    /** Only read when preset is "custom". */
    customDate: z.union([dateOnlySchema, z.literal("")]),
  })
  .refine((value) => value.preset !== "custom" || value.customDate.length > 0, {
    path: ["customDate"],
    message: "Choose the day you want to reopen it.",
  });

export const reopenCapsuleSchema = z.object({
  id: z.string().uuid(),
  currentIntensity: intensitySchema,
  outcome: z.string().trim().max(1000, "Use 1000 characters or fewer."),
  whatChanged: z.string().trim().max(1000, "Use 1000 characters or fewer."),
});

export type CreateCapsuleInput = z.infer<typeof createCapsuleSchema>;
export type ReopenCapsuleInput = z.infer<typeof reopenCapsuleSchema>;
