import type { Metadata } from "next";
import Link from "next/link";

import { AuthCard } from "@/components/auth/auth-card";
import { LoginForm } from "@/components/auth/login-form";
import { getSafeRedirectPath } from "@/lib/auth/redirect";
import { ROUTES } from "@/lib/constants/routes";

export const metadata: Metadata = { title: "Log in" };

interface LoginPageProps {
  searchParams: Promise<{ next?: string; error?: string }>;
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const { next, error } = await searchParams;

  return (
    <AuthCard
      title="Welcome back"
      description="Log in to pick up where your thinking left off."
      footer={
        <>
          New to MindLoop Lab?{" "}
          <Link href={ROUTES.signup} className="font-medium text-primary underline-offset-4 hover:underline">
            Create an account
          </Link>
        </>
      }
    >
      <LoginForm
        next={getSafeRedirectPath(next)}
        initialError={error === "auth_callback" ? "That link has expired or was already used. Log in, or request a new one." : undefined}
      />
    </AuthCard>
  );
}
