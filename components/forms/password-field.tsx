"use client";

import * as React from "react";
import { Eye, EyeOff } from "lucide-react";

import { TextField, type TextFieldProps } from "@/components/forms/text-field";

type PasswordFieldProps = Omit<TextFieldProps, "type" | "endAdornment">;

export const PasswordField = React.forwardRef<HTMLInputElement, PasswordFieldProps>((props, ref) => {
  const [visible, setVisible] = React.useState(false);

  return (
    <TextField
      ref={ref}
      type={visible ? "text" : "password"}
      endAdornment={
        <button
          type="button"
          onClick={() => setVisible((current) => !current)}
          aria-label={visible ? "Hide password" : "Show password"}
          aria-pressed={visible}
          className="flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          {visible ? <EyeOff className="h-4 w-4" aria-hidden="true" /> : <Eye className="h-4 w-4" aria-hidden="true" />}
        </button>
      }
      {...props}
    />
  );
});
PasswordField.displayName = "PasswordField";
