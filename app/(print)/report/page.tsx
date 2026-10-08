import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { Logo } from "@/components/brand/logo";
import { PrintButton } from "@/components/insights/print-button";
import { getCurrentProfile } from "@/lib/auth/session";
import { ROUTES } from "@/lib/constants/routes";
import { PREDICTION_OUTCOMES } from "@/lib/constants/phase3";
import { TRAFFIC_LIGHTS } from "@/lib/constants/thoughts";
import { getInsights } from "@/lib/insights/queries";
import { describeRange, parseInsightRange } from "@/lib/insights/range";
import { formatDate, formatDateOnly } from "@/utils/date";

export const metadata: Metadata = { title: "My reflection report", robots: { index: false, follow: false } };

/**
 * "Export My Reflection": a clean, self-contained report the user can print or
 * save as a PDF from the browser dialog.
 *
 * Everything comes from getInsights(), which reads only the signed-in user's own
 * rows behind RLS. No id is accepted from the URL, so there is nothing to tamper
 * with, and another user's data can never appear here.
 */
export default async function ReportPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const range = parseInsightRange(params.range);
  const [data, profile] = await Promise.all([getInsights(range), getCurrentProfile()]);

  const generatedAt = new Date().toISOString();
  const owner = profile?.full_name?.trim();

  return (
    <div className="mx-auto max-w-3xl px-5 py-8 sm:px-8 sm:py-12 print:max-w-none print:px-0 print:py-0">
      {/* Screen-only controls. `print:hidden` keeps them out of the paper copy. */}
      <div className="mb-8 flex flex-wrap items-center justify-between gap-3 print:hidden">
        <Link
          href={`${ROUTES.insights}?range=${range}`}
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Back to Insights
        </Link>
        <PrintButton />
      </div>

      <article className="space-y-8 print:space-y-6 print:text-black">
        <header className="space-y-3 border-b pb-6">
          <Logo />
          <h1 className="text-2xl font-semibold sm:text-3xl">My reflection report</h1>
          <p className="text-sm text-muted-foreground print:text-neutral-600">
            {owner ? `${owner}. ` : ""}Covering {describeRange(range)}. Prepared {formatDate(generatedAt)}.
          </p>
        </header>

        <Section title="Overview">
          <dl className="grid grid-cols-2 gap-4 sm:grid-cols-3">
            <Figure label="Thoughts analysed" value={data.overview.thoughts} />
            <Figure label="Marked as feeling circular" value={data.overview.loops} />
            <Figure label="Actions completed" value={data.overview.actionsCompleted} />
            <Figure label="Predictions reviewed" value={data.overview.predictionsReviewed} />
            <Figure label="Capsules reopened" value={data.overview.capsulesReviewed} />
            <Figure label="Action completion" value={`${data.actions.rate}%`} />
          </dl>
        </Section>

        <Section title="How I read my entries at the time">
          {data.overview.thoughts === 0 ? (
            <Empty />
          ) : (
            <ul className="space-y-1.5 text-sm">
              {TRAFFIC_LIGHTS.map((light) => (
                <li key={light.value} className="flex justify-between gap-4">
                  <span>{light.label}</span>
                  <span className="tabular-nums text-muted-foreground print:text-neutral-600">
                    {data.trafficMix[light.value]} of {data.overview.thoughts}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Section>

        <Section title="Where these thoughts came from">
          {data.categories.length === 0 ? (
            <Empty />
          ) : (
            <ul className="space-y-1.5 text-sm">
              {data.categories.map((entry) => (
                <li key={entry.category} className="flex justify-between gap-4">
                  <span>{entry.category}</span>
                  <span className="tabular-nums text-muted-foreground print:text-neutral-600">{entry.count}</span>
                </li>
              ))}
            </ul>
          )}
        </Section>

        <Section title="Common triggers">
          {data.triggers.length === 0 ? (
            <Empty text="Nothing repeated often enough in this period." />
          ) : (
            <ul className="space-y-2 text-sm">
              {data.triggers.map((trigger) => (
                <li key={trigger.key}>
                  <p className="font-medium">
                    {trigger.label}
                    <span className="font-normal text-muted-foreground print:text-neutral-600">
                      {" "}
                      — {trigger.count} {trigger.count === 1 ? "entry" : "entries"}
                    </span>
                  </p>
                  {trigger.matchedTerms.length ? (
                    <p className="text-muted-foreground print:text-neutral-600">
                      From words like: {trigger.matchedTerms.join(", ")}
                    </p>
                  ) : null}
                </li>
              ))}
            </ul>
          )}
        </Section>

        <Section title="Common patterns">
          {data.patterns.length === 0 ? (
            <Empty text="No pattern showed up often enough to name in this period." />
          ) : (
            <ul className="space-y-2 text-sm">
              {data.patterns.map((pattern) => (
                <li key={pattern.id}>
                  <p className="font-medium">
                    {pattern.label}
                    <span className="font-normal text-muted-foreground print:text-neutral-600">
                      {" "}
                      — {pattern.count} {pattern.count === 1 ? "entry" : "entries"}
                    </span>
                  </p>
                  <p className="text-muted-foreground print:text-neutral-600">{pattern.description}</p>
                </li>
              ))}
            </ul>
          )}
        </Section>

        <Section title="Prediction reality">
          {data.predictions.reviewed === 0 ? (
            <Empty text="No predictions were reviewed in this period." />
          ) : (
            <>
              <ul className="space-y-1.5 text-sm">
                {PREDICTION_OUTCOMES.map((outcome) => (
                  <li key={outcome.value} className="flex justify-between gap-4">
                    <span>{outcome.label}</span>
                    <span className="tabular-nums text-muted-foreground print:text-neutral-600">
                      {data.predictions.outcomes[outcome.value]}
                    </span>
                  </li>
                ))}
              </ul>
              {data.predictions.averageConfidence !== null ? (
                <p className="mt-3 text-sm text-muted-foreground print:text-neutral-600">
                  Average confidence when writing these: {data.predictions.averageConfidence}%.
                </p>
              ) : null}
            </>
          )}
        </Section>

        <Section title="My reflections">
          {!data.currentReflection && data.pastReflections.length === 0 ? (
            <Empty text="No reflections written yet." />
          ) : (
            <ul className="space-y-4 text-sm">
              {[data.currentReflection, ...data.pastReflections]
                .filter((reflection): reflection is NonNullable<typeof reflection> => reflection !== null)
                .map((reflection) => (
                  <li key={reflection.id} className="break-inside-avoid">
                    <p className="text-xs text-muted-foreground print:text-neutral-600">
                      Week beginning {formatDateOnly(reflection.week_start)}
                    </p>
                    <p className="mt-1 whitespace-pre-wrap break-anywhere">{reflection.content}</p>
                  </li>
                ))}
            </ul>
          )}
        </Section>

        <footer className="border-t pt-6 text-xs text-muted-foreground print:text-neutral-600">
          <p>
            These figures count what you wrote yourself. They describe entries, not the person who made them, and
            nothing here is an assessment or a diagnosis.
          </p>
          <p className="mt-1.5">
            MindLoop Lab is a self-reflection tool and is not a substitute for professional mental health care.
          </p>
        </footer>
      </article>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-3 break-inside-avoid">
      <h2 className="text-lg font-semibold">{title}</h2>
      {children}
    </section>
  );
}

function Figure({ label, value }: { label: string; value: number | string }) {
  return (
    <div>
      <dt className="text-xs text-muted-foreground print:text-neutral-600">{label}</dt>
      <dd className="mt-0.5 text-2xl font-semibold tabular-nums">{value}</dd>
    </div>
  );
}

function Empty({ text = "Nothing recorded in this period." }: { text?: string }) {
  return <p className="text-sm text-muted-foreground print:text-neutral-600">{text}</p>;
}
