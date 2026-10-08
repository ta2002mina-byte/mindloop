import { ArrowDownRight, ArrowUpRight, Minus, Sparkles, type LucideIcon } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { describeTrend, type PatternTrend } from "@/lib/pattern-detector";

const ICONS: Record<Exclude<PatternTrend, "insufficient">, LucideIcon> = {
  up: ArrowUpRight,
  down: ArrowDownRight,
  steady: Minus,
  new: Sparkles,
};

/** Neutral colours on purpose: "more" is not "worse", it is only more. */
export function TrendBadge({ trend }: { trend: PatternTrend }) {
  if (trend === "insufficient") return null;
  const Icon = ICONS[trend];

  return (
    <Badge variant="outline">
      <Icon className="h-3 w-3" aria-hidden="true" />
      {describeTrend(trend)}
    </Badge>
  );
}
