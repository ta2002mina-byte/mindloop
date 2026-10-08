import type { LucideIcon } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";

interface ComingSoonProps {
  icon: LucideIcon;
  title: string;
  description: string;
  phase: number;
  highlights?: readonly string[];
}

/** Honest placeholder for sections that are built in a later phase. Not a fake feature. */
export function ComingSoon({ icon: Icon, title, description, phase, highlights }: ComingSoonProps) {
  return (
    <Card>
      <CardContent className="flex flex-col items-center gap-4 px-6 py-14 text-center sm:py-20">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-accent text-accent-foreground">
          <Icon className="h-6 w-6" aria-hidden="true" />
        </div>
        <div className="space-y-2">
          <h2 className="text-xl font-semibold">{title}</h2>
          <p className="mx-auto max-w-md text-muted-foreground">{description}</p>
        </div>
        {highlights?.length ? (
          <ul className="flex max-w-lg flex-wrap justify-center gap-2 pt-1">
            {highlights.map((item) => (
              <li key={item} className="rounded-full border bg-muted/50 px-3 py-1 text-xs text-muted-foreground">
                {item}
              </li>
            ))}
          </ul>
        ) : null}
        <p className="text-sm font-medium text-primary">Arrives in Phase {phase}</p>
      </CardContent>
    </Card>
  );
}
