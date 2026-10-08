"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";

import { FormAlert } from "@/components/forms/form-alert";
import { PasswordField } from "@/components/forms/password-field";
import { Button } from "@/components/ui/button";
import { NETWORK_ERROR_MESSAGE, getAuthErrorMessage } from "@/lib/auth/errors";
import { ROUTES } from "@/lib/constants/routes";
import { createClient } from "@/lib/supabase/client";
import { resetPasswordSchema, type ResetPasswordValues } from "@/lib/validations/auth";

export function ResetPasswordForm() {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);
  const [isDone, setIsDone] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ResetPasswordValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { password: "", confirmPassword: "" },
  });

  // After a successful update, show the confirmation briefly, then continue to the app.
  useEffect(() => {
    if (!isDone) return;
    const timer = window.setTimeout(() => {
      router.replace(ROUTES.dashboard);
      router.refresh();
    }, 1500);
    return () => window.clearTimeout(timer);
  }, [isDone, router]);

  const onSubmit = async (values: ResetPasswordValues) => {
    setServerError(null);

    try {
      const supabase = createClient();
      const { error } = await supabase.auth.updateUser({ password: values.password });

      if (error) {
        setServerError(getAuthErrorMessage(error));
        return;
      }

      setIsDone(true);
    } catch (caught) {
      console.error("[auth] Password update failed:", caught);
      setServerError(NETWORK_ERROR_MESSAGE);
    }
  };

  if (isDone) {
    return (
      <FormAlert variant="success" title="Password updated">
        You&apos;re all set. Taking you to your dashboard…
      </FormAlert>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">
      {serverError ? <FormAlert variant="error">{serverError}</FormAlert> : null}

      <PasswordField
        label="New password"
        autoComplete="new-password"
        placeholder="At least 8 characters"
        hint="Use at least 8 characters."
        error={errors.password?.message}
        {...register("password")}
      />

      <PasswordField
        label="Confirm new password"
        autoComplete="new-password"
        placeholder="Re-enter your new password"
        error={errors.confirmPassword?.message}
        {...register("confirmPassword")}
      />

      <Button type="submit" size="lg" className="w-full" loading={isSubmitting}>
        {isSubmitting ? "Updating password…" : "Update password"}
      </Button>
    </form>
  );
}
