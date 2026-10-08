"use client";

import { SelectField } from "@/components/forms/select-field";
import { TextField } from "@/components/forms/text-field";
import { THOUGHT_CATEGORIES } from "@/lib/constants/thoughts";
import type { ThoughtDraft } from "@/lib/thoughts/draft";
import type { StepErrors } from "@/lib/thoughts/wizard";
import type { ThoughtCategory } from "@/types";

interface StepProps {
  draft: ThoughtDraft;
  update: (patch: Partial<ThoughtDraft>) => void;
  errors: StepErrors;
}

export function StepSituation({ draft, update, errors }: StepProps) {
  return (
    <div className="max-w-xl space-y-5">
      <TextField
        label="Trigger"
        placeholder="e.g. A short reply from my manager"
        maxLength={200}
        value={draft.trigger}
        error={errors.trigger}
        hint="What happened just before the thought showed up? A message, a meeting, a quiet evening."
        onChange={(event) => update({ trigger: event.target.value })}
      />

      <SelectField
        label="Category"
        value={draft.category}
        error={errors.category}
        hint="This is what the Patterns page groups by later."
        onChange={(event) => update({ category: event.target.value as ThoughtCategory })}
      >
        <option value="">Choose an area…</option>
        {THOUGHT_CATEGORIES.map((category) => (
          <option key={category} value={category}>
            {category}
          </option>
        ))}
      </SelectField>
    </div>
  );
}
