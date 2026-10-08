"use client";

import { SelectField } from "@/components/forms/select-field";
import { TextField } from "@/components/forms/text-field";
import { ACTION_PRIORITIES, PRIORITY_LABELS, TRAFFIC_LIGHT_MAP } from "@/lib/constants/thoughts";
import type { ThoughtDraft } from "@/lib/thoughts/draft";
import type { StepErrors } from "@/lib/thoughts/wizard";
import { todayAsDateInput } from "@/utils/date";
import type { ActionPriority } from "@/types";

interface StepProps {
  draft: ThoughtDraft;
  update: (patch: Partial<ThoughtDraft>) => void;
  errors: StepErrors;
}

export function StepNextAction({ draft, update, errors }: StepProps) {
  const setAction = (patch: Partial<ThoughtDraft["action"]>) =>
    update({ action: { ...draft.action, ...patch } });

  const light = draft.trafficLight ? TRAFFIC_LIGHT_MAP[draft.trafficLight] : null;

  return (
    <div className="max-w-xl space-y-5">
      {light ? (
        <p className="rounded-xl border bg-muted/40 px-3.5 py-3 text-sm text-muted-foreground">{light.explanation}</p>
      ) : null}

      <TextField
        label="Action"
        placeholder="e.g. Ask one clarifying question tomorrow morning"
        maxLength={200}
        value={draft.action.title}
        error={errors.actionTitle}
        hint="Optional, but a small step usually helps more than more thinking."
        onChange={(event) => setAction({ title: event.target.value })}
      />

      <div className="grid gap-5 sm:grid-cols-2">
        <SelectField
          label="Priority"
          value={draft.action.priority}
          onChange={(event) => setAction({ priority: event.target.value as ActionPriority })}
        >
          {ACTION_PRIORITIES.map((priority) => (
            <option key={priority} value={priority}>
              {PRIORITY_LABELS[priority]}
            </option>
          ))}
        </SelectField>

        <TextField
          label="Due date"
          type="date"
          min={todayAsDateInput()}
          value={draft.action.dueDate}
          error={errors.actionDueDate}
          onChange={(event) => setAction({ dueDate: event.target.value })}
        />
      </div>
    </div>
  );
}
