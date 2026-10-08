import type { Metadata } from "next";
import Link from "next/link";

import { AuthCard } from "@/components/auth/auth-card";
import { ForgotPasswordForm } from "@/components/auth/forgot-password-form";
import { ROUTES } from "@/lib/constants/routes";

export const metadata: Metadata = { title: "Forgot password" };

interface ForgotPasswordPageProps {
  searchParams: Promise<{ error?: string }>;
}

export default async function ForgotPasswordPage({ searchParams }: ForgotPasswordPageProps) {
  const { error } = await searchParams;

  return (
    <AuthCard
      title="Reset your password"
      description="Enter your email and we'll send you a link to choose a new password."
      footer={
        <>
          Remembered it?{" "}
          <Link href={ROUTES.login} className="font-medium text-primary underline-offset-4 hover:underline">
            Back to log in
          </Link>
        </>
      }
    >
      <ForgotPasswordForm
        initialError={error === "auth_callback" ? "That reset link has expired or was already used. Request a new one below." : undefined}
      />
    </AuthCard>
  );
}
