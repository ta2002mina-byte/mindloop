import {
  actionStepSchema,
  controlStepSchema,
  emotionStepSchema,
  factStoryStepSchema,
  situationStepSchema,
  thoughtStepSchema,
  trafficLightStepSchema,
} from "@/lib/validations/thought";
import type { ThoughtDraft } from "@/lib/thoughts/draft";

export const WIZARD_STEPS = [
  {
    key: "situation",
    label: "Situation",
    title: "Where did this come from?",
    description: "Name the situation that set the thought off, if you can. It is fine to leave it blank.",
  },
  {
    key: "thought",
    label: "Thought",
    title: "Write down the thought exactly as it is",
    description: "No tidying up. The raw version is the useful one.",
  },
  {
    key: "fact-story",
    label: "Fact vs Story",
    title: "Separate what you know from what you are adding",
    description: "Most thoughts are a mix of both. Splitting them is the whole trick.",
  },
  {
    key: "emotion",
    label: "Emotion",
    title: "How does this feel right now?",
    description: "Pick the feelings that fit and set how strong each one is.",
  },
  {
    key: "control",
    label: "Control Map",
    title: "What is actually yours to move?",
    description: "Sort the pieces of this situation into three groups.",
  },
  {
    key: "traffic-light",
    label: "Traffic Light",
    title: "Where is this thought right now?",
    description: "One read on the thought itself, not on you.",
  },
  {
    key: "action",
    label: "Next Action",
    title: "What is the smallest useful action you can take?",
    description: "Small enough that you could start it today. You can also skip this.",
  },
  {
    key: "review",
    label: "Review",
    title: "Here is the whole thing",
    description: "Check it over, then save it to your lab.",
  },
] as const;

export type WizardStepKey = (typeof WIZARD_STEPS)[number]["key"];
export const STEP_COUNT = WIZARD_STEPS.length;
export const REVIEW_STEP_INDEX = STEP_COUNT - 1;

/** Field-keyed messages for the current step. Empty object means the step is valid. */
export type StepErrors = Partial<Record<string, string>>;

function collect(issues: { path: (string | number)[]; message: string }[], map: Record<string, string>): StepErrors {
  const errors: StepErrors = {};
  for (const issue of issues) {
    const field = String(issue.path[0] ?? "");
    const key = map[field] ?? field;
    if (!errors[key]) errors[key] = issue.message;
  }
  return errors;
}

export function validateStep(stepIndex: number, draft: ThoughtDraft): StepErrors {
  switch (WIZARD_STEPS[stepIndex]?.key) {
    case "situation": {
      const result = situationStepSchema.safeParse({ category: draft.category, trigger: draft.trigger });
      return result.success ? {} : collect(result.error.issues, {});
    }
    case "thought": {
      const result = thoughtStepSchema.safeParse({ rawText: draft.rawText, title: draft.title });
      return result.success ? {} : collect(result.error.issues, {});
    }
    case "fact-story": {
      const result = factStoryStepSchema.safeParse({ facts: draft.facts, stories: draft.stories });
      return result.success ? {} : collect(result.error.issues, {});
    }
    case "emotion": {
      const result = emotionStepSchema.safeParse({ emotions: draft.emotions });
      return result.success ? {} : collect(result.error.issues, {});
    }
    case "control": {
      const result = controlStepSchema.safeParse({ controlItems: draft.controlItems });
      return result.success ? {} : collect(result.error.issues, {});
    }
    case "traffic-light": {
      const result = trafficLightStepSchema.safeParse({ trafficLight: draft.trafficLight });
      return result.success ? {} : { trafficLight: "Choose one of the three states." };
    }
    case "action": {
      const result = actionStepSchema.safeParse(draft.action);
      return result.success
        ? {}
        : collect(result.error.issues, { title: "actionTitle", dueDate: "actionDueDate" });
    }
    default:
      return {};
  }
}

/** Every step up to and including `stepIndex` must be valid before it can be opened. */
export function firstInvalidStep(draft: ThoughtDraft, upTo: number): number | null {
  for (let index = 0; index < upTo; index += 1) {
    if (Object.keys(validateStep(index, draft)).length > 0) return index;
  }
  return null;
}
