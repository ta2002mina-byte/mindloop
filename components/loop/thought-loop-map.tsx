"use client";

import { ArrowLeft, Cloud, MessageSquareText, Repeat, Waves, Zap, type LucideIcon } from "lucide-react";
import { useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { TRAFFIC_LIGHT_MAP } from "@/lib/constants/thoughts";
import type { LoopNodeData, LoopNodeId, LoopSection } from "@/lib/loop/loop-map";
import { cn } from "@/lib/utils";

interface NodeStyle {
  icon: LucideIcon;
  tile: string;
  ring: string;
}

/** Full class names, so Tailwind can see them. */
const NODE_STYLES: Record<LoopNodeId, NodeStyle> = {
  trigger: { icon: Zap, tile: "bg-amber-500/15 text-amber-700 dark:text-amber-300", ring: "ring-amber-500/50" },
  thought: { icon: MessageSquareText, tile: "bg-primary/10 text-primary", ring: "ring-primary/50" },
  assumption: { icon: Cloud, tile: "bg-violet-500/15 text-violet-700 dark:text-violet-300", ring: "ring-violet-500/50" },
  emotion: { icon: Waves, tile: "bg-sky-500/15 text-sky-700 dark:text-sky-300", ring: "ring-sky-500/50" },
  repeated: { icon: Repeat, tile: "bg-signal/15 text-signal", ring: "ring-signal/50" },
};

function SectionView({ section }: { section: LoopSection }) {
  switch (section.kind) {
    case "text":
      return (
        <p className={cn("whitespace-pre-wrap break-anywhere text-sm leading-relaxed", section.muted && "text-muted-foreground")}>
          {section.text}
        </p>
      );

    case "list":
      return (
        <div className="space-y-2">
          {section.title ? <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{section.title}</p> : null}
          {section.items.length === 0 ? (
            <p className="text-sm text-muted-foreground">{section.emptyText}</p>
          ) : (
            <ul className="space-y-2 text-sm">
              {section.items.map((item, index) => (
                <li key={`${index}-${item.slice(0, 12)}`} className="flex gap-2">
                  <span aria-hidden="true" className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-muted-foreground/60" />
                  <span className="break-anywhere">{item}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      );

    case "bars":
      return (
        <div className="space-y-3">
          {section.title ? <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{section.title}</p> : null}
          <ul className="space-y-3">
            {section.items.map((item) => (
              <li key={item.label} className="space-y-1.5">
                <div className="flex items-baseline justify-between gap-3 text-sm">
                  <span className="break-anywhere font-medium">{item.label}</span>
                  <span className="shrink-0 tabular-nums text-muted-foreground">{item.caption}</span>
                </div>
                <div
                  className="h-1.5 w-full overflow-hidden rounded-full bg-muted"
                  role="img"
                  aria-label={`${item.label}: ${item.value} out of 10`}
                >
                  <div className="h-full rounded-full bg-primary/70" style={{ width: `${item.value * 10}%` }} />
                </div>
              </li>
            ))}
          </ul>
        </div>
      );

    case "chips":
      return (
        <div className="space-y-2">
          {section.title ? <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{section.title}</p> : null}
          <ul className="flex flex-wrap gap-2">
            {section.items.map((item) => (
              <li key={item}>
                <Badge variant="outline">{item}</Badge>
              </li>
            ))}
          </ul>
        </div>
      );

    case "note": {
      const meta = TRAFFIC_LIGHT_MAP[section.tone];
      return (
        <div className={cn("rounded-xl border p-3.5", meta.border, meta.tint)}>
          <p className={cn("text-sm font-medium", meta.text)}>{section.title}</p>
          <p className="mt-1 text-sm text-muted-foreground">{section.text}</p>
        </div>
      );
    }
  }
}

function DetailPanel({ node, id }: { node: LoopNodeData; id: string }) {
  const style = NODE_STYLES[node.id];
  const Icon = style.icon;

  return (
    <div id={id} aria-live="polite" className="animate-in fade-in-0 slide-in-from-bottom-1 space-y-4 rounded-2xl border bg-muted/30 p-4 duration-300 sm:p-5">
      <div className="flex items-center gap-3">
        <span className={cn("flex h-9 w-9 items-center justify-center rounded-xl", style.tile)}>
          <Icon className="h-4 w-4" aria-hidden="true" />
        </span>
        <h3 className="text-base font-semibold">{node.label}</h3>
      </div>
      <div className="space-y-4">
        {node.sections.map((section, index) => (
          <SectionView key={`${node.id}-${index}`} section={section} />
        ))}
      </div>
    </div>
  );
}

interface ThoughtLoopMapProps {
  nodes: LoopNodeData[];
}

/**
 * The signature visual of the app: one thought drawn as a loop.
 *
 * Desktop: the loop on the left, the selected step's details on the right.
 * Mobile: the same list stacks vertically and the details open right under the
 * step you tapped, so nothing needs a hover or a wide screen.
 */
export function ThoughtLoopMap({ nodes }: ThoughtLoopMapProps) {
  const [selectedId, setSelectedId] = useState<LoopNodeId>(nodes[0]?.id ?? "trigger");
  const selected = nodes.find((node) => node.id === selectedId) ?? nodes[0];
  const panelId = "loop-node-details";

  if (!selected) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Thought loop map</CardTitle>
        <CardDescription>
          How this thought moves from trigger to repeated thinking. Select a step to see what you wrote for it.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
          <div className="relative pr-10 sm:pr-12">
            <ol aria-label="The loop, step by step" className="relative">
              {nodes.map((node, index) => {
                const style = NODE_STYLES[node.id];
                const Icon = style.icon;
                const isSelected = node.id === selectedId;
                const isLast = index === nodes.length - 1;

                return (
                  <li
                    key={node.id}
                    className="animate-in fade-in-0 slide-in-from-bottom-2 fill-mode-backwards duration-500"
                    style={{ animationDelay: `${index * 90}ms` }}
                  >
                    <button
                      type="button"
                      aria-pressed={isSelected}
                      aria-controls={panelId}
                      onClick={() => setSelectedId(node.id)}
                      className={cn(
                        "group flex w-full items-center gap-3 rounded-2xl border bg-card p-3.5 text-left shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                        isSelected && cn("bg-accent/50 ring-2", style.ring),
                      )}
                    >
                      <span className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition-transform group-hover:scale-105", style.tile)}>
                        <Icon className="h-5 w-5" aria-hidden="true" />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block text-xs font-medium uppercase tracking-wide text-muted-foreground">
                          {index + 1}. {node.label}
                        </span>
                        <span className="line-clamp-2 break-anywhere text-sm font-medium">{node.summary}</span>
                      </span>
                    </button>

                    {isSelected ? (
                      <div className="mt-3 lg:hidden">
                        <DetailPanel node={node} id={`${panelId}-mobile`} />
                      </div>
                    ) : null}

                    {isLast ? null : (
                      <div aria-hidden="true" className="flex h-7 items-center justify-center">
                        <span className="h-full w-0 border-l-2 border-dashed border-primary/40" />
                      </div>
                    )}
                  </li>
                );
              })}
            </ol>

            {/* The loop-back: the last step feeds the first. Decorative, described in text below. */}
            <div aria-hidden="true" className="pointer-events-none absolute bottom-8 right-0 top-8 w-9">
              <svg className="h-full w-full text-primary/50" viewBox="0 0 36 100" preserveAspectRatio="none" fill="none">
                <path
                  d="M4 100 C 34 100, 34 0, 4 0"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeDasharray="6 6"
                  vectorEffect="non-scaling-stroke"
                  className="animate-flow"
                />
              </svg>
              <ArrowLeft className="absolute -top-2 left-0 h-4 w-4 text-primary/70" />
            </div>
            <p className="sr-only">The last step, repeated thinking, loops back to the trigger.</p>
          </div>

          <div className="hidden lg:block">
            <DetailPanel node={selected} id={panelId} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
