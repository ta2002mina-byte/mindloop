"use client";

import { TRAFFIC_LIGHTS } from "@/lib/constants/thoughts";
import type { ThoughtDraft } from "@/lib/thoughts/draft";
import type { StepErrors } from "@/lib/thoughts/wizard";
import { cn } from "@/lib/utils";
import type { TrafficLight } from "@/types";

interface StepProps {
  draft: ThoughtDraft;
  update: (patch: Partial<ThoughtDraft>) => void;
  errors: StepErrors;
}

export function StepTrafficLight({ draft, update, errors }: StepProps) {
  const selected = TRAFFIC_LIGHTS.find((light) => light.value === draft.trafficLight) ?? null;

  return (
    <div className="max-w-2xl space-y-5">
      <fieldset className="space-y-3">
        <legend className="sr-only">Traffic light</legend>
        <div className="grid gap-3">
          {TRAFFIC_LIGHTS.map((light) => {
            const isSelected = draft.trafficLight === light.value;
            return (
              <label
                key={light.value}
                className={cn(
                  "flex cursor-pointer items-start gap-3 rounded-2xl border p-4 transition-colors",
                  isSelected ? cn(light.border, light.tint) : "border-border bg-card hover:bg-accent/40",
                  "focus-within:ring-2 focus-within:ring-ring",
                )}
              >
                <input
                  type="radio"
                  name="traffic-light"
                  value={light.value}
                  checked={isSelected}
                  onChange={() => update({ trafficLight: light.value as TrafficLight })}
                  className="mt-1 h-4 w-4 shrink-0 accent-primary focus:outline-none"
                />
                <span className="space-y-1">
                  <span className={cn("flex items-center gap-2 font-medium", isSelected && light.text)}>
                    <span aria-hidden="true" className={cn("h-2.5 w-2.5 rounded-full", light.dot)} />
                    {light.label}
                  </span>
                  <span className="block text-sm text-muted-foreground">{light.summary}</span>
                </span>
              </label>
            );
          })}
        </div>
        {errors.trafficLight ? (
          <p role="alert" className="text-sm text-destructive">
            {errors.trafficLight}
          </p>
        ) : null}
      </fieldset>

      {selected ? (
        <div role="status" className={cn("rounded-2xl border p-4 text-sm", selected.border, selected.tint)}>
          <p className={cn("font-medium", selected.text)}>{selected.label}</p>
          <p className="mt-1 text-muted-foreground">{selected.explanation}</p>
        </div>
      ) : null}

      <p className="text-xs text-muted-foreground">
        This is a label for one entry, chosen by you. It is not an assessment of you or a diagnosis of anything.
      </p>
    </div>
  );
}
