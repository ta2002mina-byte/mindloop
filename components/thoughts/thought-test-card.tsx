import { ArrowRight, Hourglass, Telescope } from "lucide-react";
import Link from "next/link";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ROUTES } from "@/lib/constants/routes";

/** The bridge from Thought → Loop to Prediction → Reality: two ways to test a thought over time. */
export function ThoughtTestCard({ thoughtId }: { thoughtId: string }) {
  const options = [
    {
      href: `${ROUTES.predictions}?thought=${thoughtId}`,
      icon: Telescope,
      title: "Make a prediction",
      description: "Write down what you expect, and check it against reality later.",
    },
    {
      href: `${ROUTES.worryCapsules}?thought=${thoughtId}`,
      icon: Hourglass,
      title: "Seal it in a capsule",
      description: "Set the worry aside, then compare how it feels then and now.",
    },
  ] as const;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Test this thought over time</CardTitle>
        <CardDescription>Optional. Both start from this thought.</CardDescription>
      </CardHeader>
      <CardContent>
        <ul className="grid gap-3 sm:grid-cols-2">
          {options.map((option) => (
            <li key={option.href}>
              <Link
                href={option.href}
                className="group flex h-full items-start gap-3 rounded-2xl border bg-card p-4 transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent text-accent-foreground">
                  <option.icon className="h-5 w-5" aria-hidden="true" />
                </span>
                <span className="min-w-0 flex-1 space-y-0.5">
                  <span className="block font-medium">{option.title}</span>
                  <span className="block text-sm text-muted-foreground">{option.description}</span>
                </span>
                <ArrowRight
                  className="mt-1 h-4 w-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5"
                  aria-hidden="true"
                />
              </Link>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
