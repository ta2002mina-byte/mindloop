import type { Metadata } from "next";
import Link from "next/link";
import { CalendarRange, Fingerprint, Layers, Repeat } from "lucide-react";

import { BarChart } from "@/components/charts/bar-chart";
import { StatTile } from "@/components/dashboard/stat-tile";
import { PageHeader } from "@/components/layout/page-header";
import { FingerprintRadar } from "@/components/patterns/fingerprint-radar";
import { PatternCard } from "@/components/patterns/pattern-card";
import { RangeTabs, parsePatternRange } from "@/components/patterns/range-tabs";
import { TriggerCard } from "@/components/patterns/trigger-card";
import { EmptyState } from "@/components/shared/empty-state";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ROUTES } from "@/lib/constants/routes";
import { getDetectorInputs } from "@/lib/patterns/queries";
import {
  PATTERN_DEFINITIONS,
  REPEATED_TRIGGER_THRESHOLD,
  buildTimeline,
  detectPatterns,
  weeksForWindow,
} from "@/lib/pattern-detector";
import { MIN_OCCURRENCES, detectTriggers } from "@/lib/trigger-detector";
import { cn } from "@/lib/utils";
import { formatDayMonth } from "@/utils/date";

export const metadata: Metadata = { title: "Patterns" };

/** Short labels for the fingerprint chart; the full names appear on the cards. */
const SHORT_LABELS: Record<string, string> = {
  what_if: "What-if",
  replaying: "Replaying",
  future_prediction: "Future",
  decision_looping: "Decisions",
  perfection: "Perfection",
  social_interpretation: "Social",
  worst_case: "Worst-case",
};

function joinLabels(labels: string[]): string {
  if (labels.length <= 1) return labels[0] ?? "";
  return `${labels.slice(0, -1).join(", ")} and ${labels[labels.length - 1]}`;
}

export default async function PatternsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const range = parsePatternRange((await searchParams).range);
  const options = { windowDays: range };

  // Detection runs here, on the server. The page receives counts and titles, never the raw text.
  const inputs = await getDetectorInputs(range);
  const report = detectPatterns(inputs, options);
  const triggers = detectTriggers(inputs, report.thoughtPatterns, options);

  const weeks = weeksForWindow(range);
  const timeline = buildTimeline(
    inputs.map((thought) => thought.createdAt),
    weeks,
  );

  const radarData = PATTERN_DEFINITIONS.map((definition) => ({
    id: definition.id,
    label: SHORT_LABELS[definition.id] ?? definition.label,
    share: report.patterns.find((pattern) => pattern.id === definition.id)?.share ?? 0,
  }));

  const leading = report.patterns.slice(0, 2).map((pattern) => pattern.label.toLowerCase());
  const hasTriggers = triggers.recurring.length + triggers.contexts.length > 0;

  return (
    <div className="space-y-8">
      <PageHeader
        className="mb-0 sm:mb-0"
        title="Patterns"
        description="See what your recent entries have in common."
        actions={<RangeTabs active={range} />}
      />

      {report.totalThoughts === 0 ? (
        <EmptyState
          icon={Fingerprint}
          title={`No entries in the last ${range} days`}
          description="Patterns are worked out from the thoughts you save. Once you have a few, this page shows where they cluster and which triggers keep returning."
          action={
            <Link href={ROUTES.newThought} className={cn(buttonVariants())}>
              Analyse a thought
            </Link>
          }
        />
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
            <StatTile label={`Entries, last ${range} days`} value={report.totalThoughts} icon={CalendarRange} />
            <StatTile label="Patterns showing up" value={report.patterns.length} icon={Layers} hint="of 7 kinds of thinking" />
            <StatTile label="Loops detected" value={report.loops.count} icon={Repeat} hint="entries in a repeating loop" />
            <StatTile label="Recurring triggers" value={triggers.recurring.length} icon={Fingerprint} hint={`noted ${MIN_OCCURRENCES}+ times`} />
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Your fingerprint</CardTitle>
                <CardDescription>
                  {leading.length > 0
                    ? `Your recent entries show more activity around ${joinLabels(leading)}.`
                    : "No clear pattern stands out in your recent entries yet."}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <FingerprintRadar data={radarData} />
                <p className="mt-3 text-xs text-muted-foreground">
                  Each spoke is the share of your last {range} days of entries whose wording lines up with that kind of
                  thinking. It describes entries, not you.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Timeline</CardTitle>
                <CardDescription>Entries saved per week. Each column starts on the date shown.</CardDescription>
              </CardHeader>
              <CardContent>
                <BarChart
                  ariaLabel={`Entries saved per week over the last ${weeks} weeks`}
                  data={timeline.map((bucket) => ({ label: formatDayMonth(bucket.start), value: bucket.count }))}
                  labelStep={weeks > 8 ? 2 : 1}
                />
                {report.previousTotal > 0 ? (
                  <p className="mt-4 text-sm text-muted-foreground">
                    The {range} days before this had {report.previousTotal} {report.previousTotal === 1 ? "entry" : "entries"}.
                  </p>
                ) : null}
              </CardContent>
            </Card>
          </div>

          {report.totalThoughts < 3 ? (
            <p className="rounded-xl border border-dashed px-4 py-3 text-sm text-muted-foreground">
              With only {report.totalThoughts} {report.totalThoughts === 1 ? "entry" : "entries"} so far, treat anything
              below as a first impression. It gets more useful as you save more thoughts.
            </p>
          ) : null}

          <section aria-labelledby="patterns-heading" className="space-y-4">
            <div className="space-y-1">
              <h2 id="patterns-heading" className="text-lg font-semibold">
                Kinds of thinking
              </h2>
              <p className="text-sm text-muted-foreground">
                Matched from the words in your own entries. One entry can belong to more than one.
              </p>
            </div>
            {report.patterns.length === 0 ? (
              <p className="rounded-xl border border-dashed px-4 py-6 text-center text-sm text-muted-foreground">
                None of the seven kinds of thinking show up in these entries.
              </p>
            ) : (
              <ul className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {report.patterns.map((pattern) => (
                  <li key={pattern.id}>
                    <PatternCard pattern={pattern} totalEntries={report.totalThoughts} weeks={weeks} />
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section aria-labelledby="triggers-heading" className="space-y-6">
            <div className="space-y-1">
              <h2 id="triggers-heading" className="text-lg font-semibold">
                Hidden triggers
              </h2>
              <p className="text-sm text-muted-foreground">
                Situations that come back across your entries. Only things you have written are used.
              </p>
            </div>

            {hasTriggers ? null : (
              <p className="rounded-xl border border-dashed px-4 py-6 text-center text-sm text-muted-foreground">
                Nothing has come up on {MIN_OCCURRENCES} or more entries yet.
              </p>
            )}

            {triggers.recurring.length > 0 ? (
              <div className="space-y-3">
                <h3 className="text-sm font-medium text-muted-foreground">Triggers you noted more than once</h3>
                <ul className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                  {triggers.recurring.map((trigger) => (
                    <li key={trigger.key}>
                      <TriggerCard trigger={trigger} weeks={weeks} />
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}

            {triggers.contexts.length > 0 ? (
              <div className="space-y-3">
                <h3 className="text-sm font-medium text-muted-foreground">Contexts that keep appearing in your wording</h3>
                <ul className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                  {triggers.contexts.map((trigger) => (
                    <li key={trigger.key}>
                      <TriggerCard trigger={trigger} weeks={weeks} />
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </section>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">How this is worked out</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-muted-foreground">
              <p>
                Nothing here is a score or a diagnosis. A thought is linked to a kind of thinking only when specific words
                or phrases in it match, and those words are shown on each card.
              </p>
              <p>
                An entry counts as a <span className="font-medium text-foreground">loop</span> when you marked it as
                feeling circular, or when the same trigger appears on {REPEATED_TRIGGER_THRESHOLD} or more entries in the
                period.
              </p>
              <p>
                Trends compare the period shown with the equally long one before it. &ldquo;More&rdquo; means more
                entries, not something to worry about.
              </p>
            </CardContent>
          </Card>
        </>
      )}

      <p className="text-xs text-muted-foreground">
        MindLoop Lab is a self-reflection tool and is not a substitute for professional mental health care.
      </p>
    </div>
  );
}
