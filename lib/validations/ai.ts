import { z } from "zod";

import { THOUGHT_CATEGORIES } from "@/lib/constants/thoughts";

/** What the browser is allowed to send to the AI action. */
export const analyzeRequestSchema = z.object({
  rawText: z
    .string()
    .trim()
    .min(20, "Write a bit more of the thought first, so there is something to work with.")
    .max(5000, "That is longer than the analyser accepts. Trim it a little."),
  trigger: z.string().trim().max(200).optional(),
  category: z
    .string()
    .trim()
    .max(40)
    .optional()
    // An unknown category is dropped rather than rejected: it is only context.
    .transform((value) => (value && (THOUGHT_CATEGORIES as readonly string[]).includes(value) ? value : undefined)),
});

export type AnalyzeRequest = z.infer<typeof analyzeRequestSchema>;
