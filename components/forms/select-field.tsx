import * as React from "react";

import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";

export interface SelectFieldProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label: string;
  error?: string;
  hint?: string;
  /** Hide the visible label but keep it for screen readers (filter bars). */
  srOnlyLabel?: boolean;
}

export const SelectField = React.forwardRef<HTMLSelectElement, SelectFieldProps>(
  ({ id, label, error, hint, srOnlyLabel = false, children, ...props }, ref) => {
    const generatedId = React.useId();
    const fieldId = id ?? generatedId;
    const errorId = `${fieldId}-error`;
    const hintId = `${fieldId}-hint`;
    const showHint = Boolean(hint) && !error;

    return (
      <div className="space-y-2">
        <Label htmlFor={fieldId} className={srOnlyLabel ? "sr-only" : undefined}>
          {label}
        </Label>
        <Select
          ref={ref}
          id={fieldId}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? errorId : showHint ? hintId : undefined}
          {...props}
        >
          {children}
        </Select>
        {showHint ? (
          <p id={hintId} className="text-sm text-muted-foreground">
            {hint}
          </p>
        ) : null}
        {error ? (
          <p id={errorId} className="text-sm text-destructive">
            {error}
          </p>
        ) : null}
      </div>
    );
  },
);
SelectField.displayName = "SelectField";
