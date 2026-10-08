import type { Metadata } from "next";
import Link from "next/link";

import { AuthCard } from "@/components/auth/auth-card";
import { ResetPasswordForm } from "@/components/auth/reset-password-form";
import { FormAlert } from "@/components/forms/form-alert";
import { Button } from "@/components/ui/button";
import { getCurrentUser } from "@/lib/auth/session";
import { ROUTES } from "@/lib/constants/routes";

export const metadata: Metadata = { title: "Choose a new password" };

export default async function ResetPasswordPage() {
  // The emailed link signs the user in (via /auth/callback) before landing here.
  // No session means the link was missing, expired, or opened in a different browser.
  const user = await getCurrentUser();

  if (!user) {
    return (
      <AuthCard title="This link can't be used" description="Reset links expire and only work once.">
        <div className="space-y-5">
          <FormAlert variant="error">
            We couldn&apos;t verify your reset link. Request a new one and open it in the same browser you used to ask for it.
          </FormAlert>
          <Button asChild size="lg" className="w-full">
            <Link href={ROUTES.forgotPassword}>Request a new link</Link>
          </Button>
        </div>
      </AuthCard>
    );
  }

  return (
    <AuthCard title="Choose a new password" description="Pick something you haven't used with MindLoop Lab before.">
      <ResetPasswordForm />
    </AuthCard>
  );
}
