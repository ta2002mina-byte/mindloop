import type { Metadata } from "next";
import Link from "next/link";
import { CheckCircle2, Download, Fingerprint, Hourglass, Repeat, Telescope, TrendingUp } from "lucide-react";

import { BarChart } from "@/components/charts/bar-chart";
import { TrafficMixBar } from "@/components/charts/traffic-mix-bar";
import { StatTile } from "@/components/dashboard/stat-tile";
import { ActionCompletionCard } from "@/components/insights/action-completion-card";
import { InsightRangeTabs } from "@/components/insights/insight-range-tabs";
import { PredictionRealityCard } from "@/components/insights/prediction-reality-card";
import { ReflectionForm } from "@/components/insights/reflection-form";
import { TopList, type TopListEntry } from "@/components/insights/top-list";
import { PageHeader } from "@/components/layout/page-header";
import { PageSection } from "@/components/layout/page-section";
import { EmptyState } from "@/components/shared/empty-state";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ROUTES, reportRoute } from "@/lib/constants/routes";
import { getInsights } from "@/lib/insights/queries";
import { describeRange, parseInsightRange } from "@/lib/insights/range";
import { weeksForWindow } from "@/lib/pattern-detector";
import { cn } from "@/lib/utils";
import { formatDateOnly, formatDayMonth } from "@/utils/date";

export const metadata: Metadata = { title: "Insights" };

export default async function InsightsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const range = parseInsightRange(params.range);
  const data = await getInsights(range);

  const weeks = weeksForWindow(range);
  const hasEntries = data.overview.thoughts > 0;

  const triggerEntries: TopListEntry[] = data.triggers.map((trigger) => ({
    key: trigger.key,
    label: trigger.label,
    count: trigger.count,
    detail: trigger.matchedTerms.length ? `From words like: ${trigger.matchedTerms.join(", ")}` : undefined,
  }));

  const patternEntries: TopListEntry[] = data.patterns.map((pattern) => ({
    key: pattern.id,
    label: pattern.label,
    count: pattern.count,
    detail: pattern.description,
  }));

  return (
    <>
      <PageHeader
        title="Insights"
        description={`How your thinking looked over ${describeRange(range)}. Descriptive only: these are counts of what you wrote, not a score.`}
        actions={
          <Link
            href={reportRoute(range)}
            target="_blank"
            rel="noreferrer"
            className={cn(buttonVariants({ variant: "outline" }))}
          >
            <Download aria-hidden="true" />
            Export my reflection
          </Link>
        }
      />

      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <InsightRangeTabs active={range} basePath={ROUTES.insights} />
        <p className="text-sm text-muted-foreground">Charts and lists update with the range.</p>
      </div>

      {!hasEntries ? (
        <div className="space-y-6">
          <EmptyState
            icon={TrendingUp}
            title={`Nothing in ${describeRange(range)}`}
            description="Insights are built from your own entries, so this fills in as you use the Thought Lab. Try a wider range, or analyse a thought first."
          />
          <PageSection title="Reflection" description="You can still write this week's note.">
            <ReflectionForm weekStart={data.currentWeekStart} existing={data.currentReflection} />
          </PageSection>
        </div>
      ) : (
        <div className="space-y-8">
          <PageSection
            title="Overview"
            description={`Everything below covers ${describeRange(range)}.`}
          >
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
              <StatTile label="Thoughts" value={data.overview.thoughts} icon={TrendingUp} hint={`Over ${range} days`} />
              <StatTile
                label="Loop frequency"
                value={data.overview.loops}
                icon={Repeat}
                hint={
                  data.overview.thoughts > 0
                    ? `${Math.round((data.overview.loops / data.overview.thoughts) * 100)}% marked "feels circular"`
                    : undefined
                }
              />
              <StatTile
                label="Actions completed"
                value={data.overview.actionsCompleted}
                icon={CheckCircle2}
                hint={data.actions.total > 0 ? `of ${data.actions.total} written` : undefined}
              />
              <StatTile
                label="Predictions reviewed"
                value={data.overview.predictionsReviewed}
                icon={Telescope}
                hint={data.predictions.waiting > 0 ? `${data.predictions.waiting} still waiting` : undefined}
              />
              <StatTile
                label="Capsules reviewed"
                value={data.overview.capsulesReviewed}
                icon={Hourglass}
                hint={data.capsules.waiting > 0 ? `${data.capsules.waiting} still sealed` : undefined}
              />
            </div>
          </PageSection>

          <div className="grid gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Entries per week</CardTitle>
                <CardDescription>Each column starts on the date shown.</CardDescription>
              </CardHeader>
              <CardContent>
                <BarChart
                  ariaLabel={`Entries saved per week over the last ${weeks} weeks`}
                  data={data.timeline.map((bucket) => ({ label: formatDayMonth(bucket.start), value: bucket.count }))}
                  labelStep={weeks > 8 ? 2 : 1}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Traffic light mix</CardTitle>
                <CardDescription>How you read your own entries at the time.</CardDescription>
              </CardHeader>
              <CardContent>
                <TrafficMixBar counts={data.trafficMix} />
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Fingerprint className="h-4 w-4 text-primary" aria-hidden="true" />
                  Common triggers
                </CardTitle>
                <CardDescription>Contexts that came back across your entries.</CardDescription>
              </CardHeader>
              <CardContent>
                <TopList
                  entries={triggerEntries}
                  total={data.overview.thoughts}
                  emptyText="Nothing repeated often enough to show yet. Noting a trigger on each entry makes this sharper."
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Common patterns</CardTitle>
                <CardDescription>Shapes of thinking the wording lines up with.</CardDescription>
              </CardHeader>
              <CardContent>
                <TopList
                  entries={patternEntries}
                  total={data.overview.thoughts}
                  emptyText="No pattern showed up often enough to be worth naming yet."
                />
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Prediction reality</CardTitle>
                <CardDescription>What you expected, next to what you said happened.</CardDescription>
              </CardHeader>
              <CardContent>
                <PredictionRealityCard data={data.predictions} />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Action completion</CardTitle>
                <CardDescription>The small steps you set yourself.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <ActionCompletionCard data={data.actions} />
                {data.capsules.averageThen !== null && data.capsules.averageNow !== null ? (
                  <p className="border-t pt-4 text-sm text-muted-foreground">
                    Across the capsules you reopened, worry averaged {data.capsules.averageThen} out of 10 when you
                    sealed them and {data.capsules.averageNow} out of 10 when you opened them.
                  </p>
                ) : null}
              </CardContent>
            </Card>
          </div>

          <PageSection title="Reflection" description="Your own words. Nothing here is generated for you.">
            <ReflectionForm weekStart={data.currentWeekStart} existing={data.currentReflection} />

            {data.pastReflections.length > 0 ? (
              <ul className="mt-6 max-w-2xl space-y-3">
                {data.pastReflections.map((reflection) => (
                  <li key={reflection.id} className="rounded-xl border bg-muted/20 p-4">
                    <p className="text-xs text-muted-foreground">
                      Week beginning {formatDateOnly(reflection.week_start)}
                    </p>
                    <p className="mt-1.5 whitespace-pre-wrap break-anywhere text-sm">{reflection.content}</p>
                  </li>
                ))}
              </ul>
            ) : null}
          </PageSection>

          <p className="text-xs text-muted-foreground">
            MindLoop Lab is a self-reflection tool and is not a substitute for professional mental health care.
          </p>
        </div>
      )}
    </>
  );
}
