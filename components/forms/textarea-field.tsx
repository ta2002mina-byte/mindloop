import * as React from "react";

import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

export interface TextareaFieldProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string;
  error?: string;
  hint?: string;
  /** Shows "123 / 500" under the field. */
  maxChars?: number;
  currentChars?: number;
}

/** Label + textarea + hint/error, wired together with the right ARIA attributes. */
export const TextareaField = React.forwardRef<HTMLTextAreaElement, TextareaFieldProps>(
  ({ id, label, error, hint, maxChars, currentChars, className, ...props }, ref) => {
    const generatedId = React.useId();
    const fieldId = id ?? generatedId;
    const errorId = `${fieldId}-error`;
    const hintId = `${fieldId}-hint`;
    const showHint = Boolean(hint) && !error;
    const describedBy = error ? errorId : showHint ? hintId : undefined;

    return (
      <div className="space-y-2">
        <Label htmlFor={fieldId}>{label}</Label>
        <Textarea
          ref={ref}
          id={fieldId}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
          className={cn(className)}
          {...props}
        />
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
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
          {maxChars ? (
            <p
              className={cn(
                "shrink-0 text-xs tabular-nums text-muted-foreground",
                (currentChars ?? 0) > maxChars && "text-destructive",
              )}
            >
              {currentChars ?? 0} / {maxChars}
            </p>
          ) : null}
        </div>
      </div>
    );
  },
);
TextareaField.displayName = "TextareaField";
