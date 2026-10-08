"use client";

import { Check } from "lucide-react";

import { STEP_COUNT, WIZARD_STEPS } from "@/lib/thoughts/wizard";
import { cn } from "@/lib/utils";

interface WizardStepperProps {
  current: number;
  /** Steps the user has completed at least once, so they can jump back. */
  furthest: number;
  onSelect: (index: number) => void;
}

export function WizardStepper({ current, furthest, onSelect }: WizardStepperProps) {
  const step = WIZARD_STEPS[current];
  const progress = ((current + 1) / STEP_COUNT) * 100;

  return (
    <div className="space-y-3">
      {/* Mobile: one line of text plus a progress bar. */}
      <div className="flex items-baseline justify-between gap-3 sm:hidden">
        <p className="text-sm font-medium">{step?.label}</p>
        <p className="text-xs tabular-nums text-muted-foreground">
          Step {current + 1} of {STEP_COUNT}
        </p>
      </div>
      <div
        className="h-1.5 w-full overflow-hidden rounded-full bg-muted sm:hidden"
        role="progressbar"
        aria-valuenow={current + 1}
        aria-valuemin={1}
        aria-valuemax={STEP_COUNT}
        aria-label={`Step ${current + 1} of ${STEP_COUNT}`}
      >
        <div className="h-full rounded-full bg-primary transition-all duration-300" style={{ width: `${progress}%` }} />
      </div>

      {/* Tablet and up: the full trail. */}
      <ol className="hidden flex-wrap items-center gap-x-1 gap-y-2 sm:flex">
        {WIZARD_STEPS.map((item, index) => {
          const isCurrent = index === current;
          const isDone = index < current;
          const reachable = index <= furthest;

          return (
            <li key={item.key} className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => onSelect(index)}
                disabled={!reachable}
                aria-current={isCurrent ? "step" : undefined}
                className={cn(
                  "flex items-center gap-2 rounded-full px-2.5 py-1.5 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                  isCurrent && "bg-primary text-primary-foreground",
                  !isCurrent && reachable && "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
                  !reachable && "cursor-not-allowed text-muted-foreground/50",
                )}
              >
                <span
                  className={cn(
                    "flex h-5 w-5 shrink-0 items-center justify-center rounded-full border text-[10px] tabular-nums",
                    isCurrent && "border-primary-foreground/60",
                    isDone && "border-transparent bg-success/15 text-success",
                    !isCurrent && !isDone && "border-border",
                  )}
                >
                  {isDone ? <Check className="h-3 w-3" aria-hidden="true" /> : index + 1}
                </span>
                {item.label}
              </button>
              {index < STEP_COUNT - 1 ? (
                <span aria-hidden="true" className="hidden h-px w-3 bg-border lg:block" />
              ) : null}
            </li>
          );
        })}
      </ol>
    </div>
  );
}
