interface FlowStepsProps {
  label: string;
  steps: readonly string[];
}

/** "A → B → C": a quiet one-line reminder of how a feature works. */
export function FlowSteps({ label, steps }: FlowStepsProps) {
  return (
    <ol aria-label={label} className="flex flex-wrap items-center gap-x-2 gap-y-2 text-sm">
      {steps.map((step, index) => (
        <li key={step} className="flex items-center gap-2">
          <span className="rounded-full border bg-card px-3 py-1 text-muted-foreground">{step}</span>
          {index < steps.length - 1 ? (
            <span aria-hidden="true" className="text-primary/60">
              →
            </span>
          ) : null}
        </li>
      ))}
    </ol>
  );
}
