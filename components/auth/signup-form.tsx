"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { MailCheck } from "lucide-react";
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
import { signupSchema, type SignupValues } from "@/lib/validations/auth";

export function SignupForm() {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);
  const [pendingEmail, setPendingEmail] = useState<string | null>(null);
  const [isRedirecting, setIsRedirecting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SignupValues>({
    resolver: zodResolver(signupSchema),
    defaultValues: { fullName: "", email: "", password: "", confirmPassword: "" },
  });

  const onSubmit = async (values: SignupValues) => {
    setServerError(null);

    try {
      const supabase = createClient();
      const { data, error } = await supabase.auth.signUp({
        email: values.email,
        password: values.password,
        options: {
          // Stored in user metadata; the database trigger copies it into public.profiles.
          data: { full_name: values.fullName },
          emailRedirectTo: `${window.location.origin}${ROUTES.authCallback}?next=${ROUTES.dashboard}`,
        },
      });

      if (error) {
        setServerError(getAuthErrorMessage(error));
        return;
      }

      // Email confirmation off: Supabase returns a session and the user is already signed in.
      if (data.session) {
        setIsRedirecting(true);
        router.replace(ROUTES.dashboard);
        router.refresh();
        return;
      }

      // Email confirmation on (also returned for already-registered emails, so we don't reveal which).
      setPendingEmail(values.email);
    } catch (caught) {
      console.error("[auth] Signup failed:", caught);
      setServerError(NETWORK_ERROR_MESSAGE);
    }
  };

  if (pendingEmail) {
    return (
      <div className="space-y-6">
        <FormAlert variant="success" title="Check your email">
          If {pendingEmail} can be used to create an account, a confirmation link is on its way. Open it to finish signing up.
        </FormAlert>
        <div className="flex items-start gap-3 rounded-xl border bg-muted/40 p-4 text-sm text-muted-foreground">
          <MailCheck className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          <p>
            Open the link in the same browser you used here. Can&apos;t find it? Check your spam folder, or{" "}
            <Link href={ROUTES.login} className="font-medium text-primary underline-offset-4 hover:underline">
              go to log in
            </Link>{" "}
            once you&apos;ve confirmed.
          </p>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">
      {serverError ? <FormAlert variant="error">{serverError}</FormAlert> : null}

      <TextField
        label="Full name"
        type="text"
        autoComplete="name"
        placeholder="Your full name"
        error={errors.fullName?.message}
        {...register("fullName")}
      />

      <TextField
        label="Email"
        type="email"
        autoComplete="email"
        inputMode="email"
        placeholder="you@example.com"
        error={errors.email?.message}
        {...register("email")}
      />

      <PasswordField
        label="Password"
        autoComplete="new-password"
        placeholder="At least 8 characters"
        hint="Use at least 8 characters."
        error={errors.password?.message}
        {...register("password")}
      />

      <PasswordField
        label="Confirm password"
        autoComplete="new-password"
        placeholder="Re-enter your password"
        error={errors.confirmPassword?.message}
        {...register("confirmPassword")}
      />

      <Button type="submit" size="lg" className="w-full" loading={isSubmitting || isRedirecting}>
        {isSubmitting || isRedirecting ? "Creating your account…" : "Create account"}
      </Button>
    </form>
  );
}
