"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";

import { FormAlert } from "@/components/forms/form-alert";
import { PasswordField } from "@/components/forms/password-field";
import { TextField } from "@/components/forms/text-field";
import { Button } from "@/components/ui/button";
import { NETWORK_ERROR_MESSAGE, getAuthErrorMessage } from "@/lib/auth/errors";
import { ROUTES } from "@/lib/constants/routes";
import { createClient } from "@/lib/supabase/client";
import { loginSchema, type LoginValues } from "@/lib/validations/auth";

interface LoginFormProps {
  /** Where to go after a successful login. Already sanitised on the server. */
  next: string;
  initialError?: string;
}

export function LoginForm({ next, initialError }: LoginFormProps) {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(initialError ?? null);
  const [isRedirecting, setIsRedirecting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  const onSubmit = async (values: LoginValues) => {
    setServerError(null);

    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithPassword({
        email: values.email,
        password: values.password,
      });

      if (error) {
        setServerError(getAuthErrorMessage(error));
        return;
      }

      // Keep the button in its loading state while the next page loads.
      setIsRedirecting(true);
      router.replace(next);
      router.refresh();
    } catch (caught) {
      console.error("[auth] Login failed:", caught);
      setServerError(NETWORK_ERROR_MESSAGE);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">
      {serverError ? <FormAlert variant="error">{serverError}</FormAlert> : null}

      <TextField
        label="Email"
        type="email"
        autoComplete="email"
        inputMode="email"
        placeholder="you@example.com"
        error={errors.email?.message}
        {...register("email")}
      />

      <div className="space-y-2">
        <PasswordField
          label="Password"
          autoComplete="current-password"
          placeholder="Your password"
          error={errors.password?.message}
          {...register("password")}
        />
        <div className="text-right">
          <Link
            href={ROUTES.forgotPassword}
            className="rounded text-sm font-medium text-primary underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            Forgot password?
          </Link>
        </div>
      </div>

      <Button type="submit" size="lg" className="w-full" loading={isSubmitting || isRedirecting}>
        {isSubmitting || isRedirecting ? "Logging in…" : "Log in"}
      </Button>
    </form>
  );
}
