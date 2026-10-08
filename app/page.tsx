import { ArrowRight, Fingerprint, FlaskConical, Hourglass, Scale, Telescope, TrendingUp } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { Logo } from "@/components/brand/logo";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getCurrentUser } from "@/lib/auth/session";
import { ROUTES } from "@/lib/constants/routes";

export const metadata: Metadata = {
  title: "MindLoop Lab — Understand Your Overthinking Patterns",
  description:
    "MindLoop Lab helps you visualize thought loops, separate facts from assumptions, review predictions, and turn overwhelming thoughts into practical next steps.",
};

const FEATURES = [
  {
    icon: FlaskConical,
    title: "Thought Lab",
    body: "Walk a single thought through fact vs. story, emotion, and a control map so it stops feeling like one tangled mess.",
  },
  {
    icon: Fingerprint,
    title: "Patterns",
    body: "See which triggers and loops actually show up most in your own entries — described from your own data, not a diagnosis.",
  },
  {
    icon: Telescope,
    title: "Predictions",
    body: "Write down what you expect to happen, then come back later and compare it with what actually did.",
  },
  {
    icon: Hourglass,
    title: "Worry Capsules",
    body: "Seal a worry until a date you choose, then reopen it and see how it looks from a few days' distance.",
  },
  {
    icon: Scale,
    title: "Decision Room",
    body: "Lay out benefits, concerns, known facts and unknowns side by side — the app organizes, you decide.",
  },
  {
    icon: TrendingUp,
    title: "Insights",
    body: "A weekly view of loop frequency, common triggers and completed actions, so progress is visible over time.",
  },
] as const;

const FLOW_STEPS = ["Trigger", "Thought", "Pattern", "Action"] as const;

export default async function HomePage() {
  const user = await getCurrentUser();
  const primaryHref = user ? ROUTES.dashboard : ROUTES.signup;
  const primaryLabel = user ? "Go to dashboard" : "Get started free";

  return (
    <div className="flex min-h-dvh flex-col bg-background text-foreground">
      <header className="border-b">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          <Link
            href="/"
            aria-label="MindLoop Lab, home"
            className="rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <Logo />
          </Link>
          <nav className="flex items-center gap-2">
            {user ? (
              <Button asChild size="sm">
                <Link href={ROUTES.dashboard}>Dashboard</Link>
              </Button>
            ) : (
              <>
                <Button asChild variant="ghost" size="sm">
                  <Link href={ROUTES.login}>Log in</Link>
                </Button>
                <Button asChild size="sm">
                  <Link href={ROUTES.signup}>Get started</Link>
                </Button>
              </>
            )}
          </nav>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero */}
        <section className="mx-auto max-w-4xl px-4 py-20 text-center sm:px-6 sm:py-28">
          <Badge variant="primary">Detect → Visualize → Understand → Test → Act</Badge>
          <h1 className="mt-6 font-display text-4xl font-semibold tracking-tight text-balance sm:text-6xl">
            See the loop. Understand the pattern.
            <br className="hidden sm:block" /> Take the next step.
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground text-balance">
            MindLoop Lab helps you visualize thought loops, separate facts from assumptions, review predictions, and
            turn overwhelming thoughts into practical next steps.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Button asChild size="lg">
              <Link href={primaryHref}>
                {primaryLabel}
                <ArrowRight aria-hidden="true" />
              </Link>
            </Button>
            {!user ? (
              <Button asChild variant="outline" size="lg">
                <Link href={ROUTES.login}>Log in</Link>
              </Button>
            ) : null}
          </div>
        </section>

        {/* Signature flow */}
        <section className="border-y bg-muted/30 py-12">
          <div className="mx-auto max-w-4xl px-4 sm:px-6">
            <ol className="flex flex-wrap items-center justify-center gap-x-2 gap-y-4">
              {FLOW_STEPS.map((step, index) => (
                <li key={step} className="flex items-center gap-2">
                  <span className="rounded-full border bg-card px-4 py-2 text-sm font-medium shadow-sm">{step}</span>
                  {index < FLOW_STEPS.length - 1 ? (
                    <ArrowRight aria-hidden="true" className="size-4 text-muted-foreground" />
                  ) : null}
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* Features */}
        <section className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="font-display text-3xl font-semibold tracking-tight">One tool, five steps to clarity</h2>
            <p className="mt-3 text-muted-foreground">
              Every feature works toward the same goal: turning a repetitive thought into something you can act on.
            </p>
          </div>

          <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((feature) => (
              <Card key={feature.title}>
                <CardHeader>
                  <feature.icon aria-hidden="true" className="size-6 text-primary" />
                  <CardTitle className="mt-2">{feature.title}</CardTitle>
                  <CardDescription>{feature.body}</CardDescription>
                </CardHeader>
                <CardContent />
              </Card>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section className="border-t bg-muted/30">
          <div className="mx-auto max-w-3xl px-4 py-16 text-center sm:px-6">
            <h2 className="font-display text-3xl font-semibold tracking-tight">
              Your next overthinking spiral doesn't have to end the same way.
            </h2>
            <p className="mt-3 text-muted-foreground">Create a free account and analyze your first thought today.</p>
            <Button asChild size="lg" className="mt-8">
              <Link href={primaryHref}>
                {primaryLabel}
                <ArrowRight aria-hidden="true" />
              </Link>
            </Button>
          </div>
        </section>
      </main>

      <footer className="border-t">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-8 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <div className="flex items-center gap-2">
            <Logo showWordmark={false} />
            <span>© {new Date().getFullYear()} MindLoop Lab</span>
          </div>
          <p className="max-w-md text-balance sm:text-right">
            MindLoop Lab is a self-reflection tool and is not a substitute for professional mental health care.
          </p>
        </div>
      </footer>
    </div>
  );
}
