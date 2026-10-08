import { z } from "zod";

/** Shared shape for the six list sections on an option. */
const sectionList = z
  .array(z.string().trim().min(2, "Write at least a couple of words.").max(240, "Use 240 characters or fewer."))
  .max(12, "Keep it to twelve items so the column stays readable.");

export const decisionRoomSchema = z.object({
  title: z
    .string()
    .trim()
    .min(3, "Give the decision a name, for example “Should I take this course?”")
    .max(160, "Use 160 characters or fewer."),
  description: z.string().trim().max(1000, "Use 1000 characters or fewer."),
});

export const decisionOptionNameSchema = z.object({
  name: z.string().trim().min(1, "Name the option.").max(80, "Use 80 characters or fewer."),
});

export const decisionOptionSchema = z.object({
  name: decisionOptionNameSchema.shape.name,
  benefits: sectionList,
  concerns: sectionList,
  knownFacts: sectionList,
  unknowns: sectionList,
  controllableItems: sectionList,
  firstStep: z.string().trim().max(300, "Use 300 characters or fewer."),
});

export type DecisionRoomInput = z.infer<typeof decisionRoomSchema>;
export type DecisionOptionInput = z.infer<typeof decisionOptionSchema>;
