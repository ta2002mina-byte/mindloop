import Link from "next/link";
import { ArrowDown, ArrowRight, Footprints, MessageSquareText, Fingerprint, Plus, Zap, type LucideIcon } from "lucide-react";

import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ROUTES } from "@/lib/constants/routes";
import type { MindLoopNode, MindLoopSummary } from "@/lib/dashboard/mindloop";
import { cn } from "@/lib/utils";

interface StageDefinition {
  key: keyof Pick<MindLoopSummary, "trigger" | "thought" | "pattern" | "action">;
  label: string;
  icon: LucideIcon;
  empty: string;
  tile: string;
}

const STAGES: readonly StageDefinition[] = [
  { key: "trigger", label: "Trigger", icon: Zap, empty: "No trigger noted yet", tile: "bg-amber-500/15 text-amber-700 dark:text-amber-300" },
  { key: "thought", label: "Thought", icon: MessageSquareText, empty: "No thoughts saved yet", tile: "bg-primary/10 text-primary" },
  { key: "pattern", label: "Pattern", icon: Fingerprint, empty: "Needs a few more entries", tile: "bg-violet-500/15 text-violet-700 dark:text-violet-300" },
  { key: "action", label: "Action", icon: Footprints, empty: "No open action", tile: "bg-signal/15 text-signal" },
];

function StageCard({ stage, node, index }: { stage: StageDefinition; node: MindLoopNode; index: number }) {
  const Icon = stage.icon;
  const hasValue = node.value !== null;

  const body = (
    <>
      <span className="flex items-center gap-2.5">
        <span className={cn("flex h-9 w-9 items-center justify-center rounded-xl", stage.tile)}>
          <Icon className="h-4 w-4" aria-hidden="true" />
        </span>
        <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{stage.label}</span>
      </span>
      <span className={cn("mt-3 line-clamp-2 break-anywhere text-base font-medium leading-snug", !hasValue && "text-muted-foreground")}>
        {node.value ?? stage.empty}
      </span>
      <span className="mt-1 block min-h-5 text-xs text-muted-foreground">{node.detail ?? ""}</span>
    </>
  );

  const className =
    "block h-full rounded-2xl border bg-card/80 p-4 shadow-sm backdrop-blur transition-all duration-200 animate-in fade-in-0 slide-in-from-bottom-2 fill-mode-backwards duration-500";

  return node.href ? (
    <Link
      href={node.href}
      className={cn(className, "hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring")}
      style={{ animationDelay: `${index * 110}ms` }}
    >
      {body}
    </Link>
  ) : (
    <div className={className} style={{ animationDelay: `${index * 110}ms` }}>
      {body}
    </div>
  );
}

/**
 * "Your MindLoop": the signature dashboard widget. One real item per stage of
 * Trigger → Thought → Pattern → Action, taken from the last 30 days.
 */
export function YourMindLoop({ summary, windowDays }: { summary: MindLoopSummary; windowDays: number }) {
  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-4">
        <CardTitle>Your MindLoop</CardTitle>
        <CardDescription>
          {summary.hasData
            ? `The trigger, thought, pattern and step that stand out in your last ${windowDays} days.`
            : "Save a thought and this fills in with your own trigger, pattern and next step."}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div
          className="relative rounded-2xl p-3 sm:p-4"
          style={{
            backgroundImage:
              "radial-gradient(60% 80% at 0% 0%, hsl(var(--primary) / 0.10), transparent 70%), radial-gradient(50% 70% at 100% 100%, hsl(var(--signal) / 0.10), transparent 70%)",
          }}
        >
          <ol className="grid gap-0 lg:grid-cols-[1fr_auto_1fr_auto_1fr_auto_1fr] lg:items-stretch">
            {STAGES.map((stage, index) => (
              <li key={stage.key} className="contents">
                <div className="min-w-0">
                  <StageCard stage={stage} node={summary[stage.key]} index={index} />
                </div>
                {index < STAGES.length - 1 ? (
                  <div aria-hidden="true" className="flex items-center justify-center py-2 text-primary/60 lg:px-2 lg:py-0">
                    <ArrowDown className="h-5 w-5 animate-soft-pulse lg:hidden" />
                    <ArrowRight className="hidden h-5 w-5 animate-soft-pulse lg:block" />
                  </div>
                ) : null}
              </li>
            ))}
          </ol>

          {/* The loop-back from Action to Trigger, drawn on wide screens. */}
          <div aria-hidden="true" className="relative mt-1 hidden h-7 lg:block">
            <div className="absolute inset-x-[12.5%] top-0 h-full rounded-b-2xl border-x-2 border-b-2 border-dashed border-primary/30" />
            <span className="absolute left-1/2 top-full -translate-x-1/2 -translate-y-1/2 bg-transparent px-2 text-[11px] text-muted-foreground">
              <span className="rounded-full border bg-card px-2.5 py-0.5">the next step shapes the next trigger</span>
            </span>
          </div>
          <p className="sr-only">The loop continues: the action you take shapes the next trigger.</p>
        </div>

        {summary.hasData ? null : (
          <div className="mt-4">
            <Link href={ROUTES.newThought} className={cn(buttonVariants())}>
              <Plus aria-hidden="true" />
              Start your first thought
            </Link>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
