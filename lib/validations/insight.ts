import { z } from "zod";

export const reflectionSchema = z.object({
  /** The Monday (UTC) of the week the reflection belongs to. */
  weekStart: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "That week looks wrong. Reload the page and try again."),
  content: z
    .string()
    .trim()
    .min(3, "Write at least a few words, or leave it for later.")
    .max(2000, "Use 2000 characters or fewer."),
});

export type ReflectionInput = z.infer<typeof reflectionSchema>;
