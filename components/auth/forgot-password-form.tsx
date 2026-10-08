"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";

import { FormAlert } from "@/components/forms/form-alert";
import { TextField } from "@/components/forms/text-field";
import { Button } from "@/components/ui/button";
import { NETWORK_ERROR_MESSAGE, getAuthErrorMessage } from "@/lib/auth/errors";
import { ROUTES } from "@/lib/constants/routes";
import { createClient } from "@/lib/supabase/client";
import { forgotPasswordSchema, type ForgotPasswordValues } from "@/lib/validations/auth";

interface ForgotPasswordFormProps {
  initialError?: string;
}

export function ForgotPasswordForm({ initialError }: ForgotPasswordFormProps) {
  const [serverError, setServerError] = useState<string | null>(initialError ?? null);
  const [sentTo, setSentTo] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ForgotPasswordValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: "" },
  });

  const onSubmit = async (values: ForgotPasswordValues) => {
    setServerError(null);
    setSentTo(null);

    try {
      const supabase = createClient();
      const { error } = await supabase.auth.resetPasswordForEmail(values.email, {
        redirectTo: `${window.location.origin}${ROUTES.authCallback}?next=${ROUTES.resetPassword}`,
      });

      if (error) {
        setServerError(getAuthErrorMessage(error));
        return;
      }

      // Same message whether or not the account exists, so this form can't be used to probe for emails.
      setSentTo(values.email);
    } catch (caught) {
      console.error("[auth] Password reset request failed:", caught);
      setServerError(NETWORK_ERROR_MESSAGE);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">
      {serverError ? <FormAlert variant="error">{serverError}</FormAlert> : null}
      {sentTo ? (
        <FormAlert variant="success" title="Check your email">
          If an account exists for {sentTo}, we&apos;ve sent a link to reset your password. Open it in this browser.
        </FormAlert>
      ) : null}

      <TextField
        label="Email"
        type="email"
        autoComplete="email"
        inputMode="email"
        placeholder="you@example.com"
        error={errors.email?.message}
        {...register("email")}
      />

      <Button type="submit" size="lg" className="w-full" loading={isSubmitting}>
        {isSubmitting ? "Sending link…" : sentTo ? "Send another link" : "Send reset link"}
      </Button>
    </form>
  );
}
