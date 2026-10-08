import * as React from "react";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

export interface TextFieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  hint?: string;
  /** Rendered inside the input on the right (for example a show/hide button). */
  endAdornment?: React.ReactNode;
}

/** Label + input + hint/error, wired together with the right ARIA attributes. */
export const TextField = React.forwardRef<HTMLInputElement, TextFieldProps>(
  ({ id, label, error, hint, endAdornment, className, ...props }, ref) => {
    const generatedId = React.useId();
    const inputId = id ?? generatedId;
    const errorId = `${inputId}-error`;
    const hintId = `${inputId}-hint`;
    const showHint = Boolean(hint) && !error;
    const describedBy = error ? errorId : showHint ? hintId : undefined;

    return (
      <div className="space-y-2">
        <Label htmlFor={inputId}>{label}</Label>
        <div className="relative">
          <Input
            ref={ref}
            id={inputId}
            aria-invalid={error ? true : undefined}
            aria-describedby={describedBy}
            className={cn(endAdornment && "pr-12", className)}
            {...props}
          />
          {endAdornment ? <div className="absolute inset-y-0 right-1 flex items-center">{endAdornment}</div> : null}
        </div>
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
TextField.displayName = "TextField";
