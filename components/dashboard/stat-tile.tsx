import type { LucideIcon } from "lucide-react";

import { Card } from "@/components/ui/card";

interface StatTileProps {
  label: string;
  value: number;
  icon: LucideIcon;
  /** Small supporting line, for example "2 ready to review". */
  hint?: string;
}

export function StatTile({ label, value, icon: Icon, hint }: StatTileProps) {
  return (
    <Card className="p-4 sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm text-muted-foreground">{label}</p>
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-accent text-accent-foreground">
          <Icon className="h-4 w-4" aria-hidden="true" />
        </span>
      </div>
      <p className="mt-3 font-display text-3xl font-semibold tracking-tight tabular-nums">{value}</p>
      <p className="mt-1 min-h-5 text-xs text-muted-foreground">{hint ?? ""}</p>
    </Card>
  );
}
