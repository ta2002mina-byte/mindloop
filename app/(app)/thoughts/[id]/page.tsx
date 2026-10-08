import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { ThoughtLoopMap } from "@/components/loop/thought-loop-map";
import { ThoughtActionsCard } from "@/components/thoughts/thought-actions-card";
import { ThoughtDetailToolbar } from "@/components/thoughts/thought-detail-toolbar";
import { ThoughtSummary } from "@/components/thoughts/thought-summary";
import { ThoughtTestCard } from "@/components/thoughts/thought-test-card";
import { Badge } from "@/components/ui/badge";
import { ROUTES } from "@/lib/constants/routes";
import { STATUS_LABELS } from "@/lib/constants/thoughts";
import { buildLoopNodes } from "@/lib/loop/loop-map";
import { PATTERN_LABELS, matchPatterns } from "@/lib/pattern-detector";
import { countSameTrigger } from "@/lib/patterns/queries";
import { getThoughtDetail } from "@/lib/thoughts/queries";
import { summaryFromDetail } from "@/lib/thoughts/summary";
import { formatDate } from "@/utils/date";

interface PageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const thought = await getThoughtDetail(id);
  return { title: thought ? thought.title : "Thought not found" };
}

export default async function ThoughtDetailPage({ params }: PageProps) {
  const { id } = await params;
  const thought = await getThoughtDetail(id);
  if (!thought) notFound();

  const summary = summaryFromDetail(thought);

  // The loop map is built on the server from this one thought plus a count of matching triggers.
  const sameTriggerCount = await countSameTrigger(thought.id, thought.trigger);
  const searchable = [thought.title, thought.raw_text, ...summary.stories].join(". ");
  const loopNodes = buildLoopNodes({
    title: thought.title,
    rawText: thought.raw_text,
    trigger: thought.trigger,
    category: thought.category,
    trafficLight: thought.traffic_light,
    facts: summary.facts,
    stories: summary.stories,
    emotions: thought.emotions.map((row) => ({ emotion: row.emotion, intensity: row.intensity })),
    sameTriggerCount,
    patternLabels: matchPatterns(searchable).map((match) => PATTERN_LABELS[match.id]),
  });

  const edited = thought.updated_at !== thought.created_at;

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <Link
          href={ROUTES.thoughts}
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          All thoughts
        </Link>

        <div className="space-y-2">
          <h1 className="break-anywhere text-2xl font-semibold sm:text-3xl">{thought.title}</h1>
          <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
            <Badge variant="outline">{STATUS_LABELS[thought.status]}</Badge>
            <span>Saved {formatDate(thought.created_at)}</span>
            {edited ? <span>, edited {formatDate(thought.updated_at)}</span> : null}
          </div>
        </div>

        <ThoughtDetailToolbar thoughtId={thought.id} status={thought.status} />
      </div>

      <ThoughtLoopMap nodes={loopNodes} />

      <ThoughtSummary data={summary} actionSlot={<ThoughtActionsCard actions={thought.actions} />} />

      <ThoughtTestCard thoughtId={thought.id} />

      <p className="text-xs text-muted-foreground">
        MindLoop Lab is a self-reflection tool and is not a substitute for professional mental health care.
      </p>
    </div>
  );
}
