import type { Metadata } from "next";
import Link from "next/link";
import { FlaskConical, Hourglass } from "lucide-react";

import { CapsuleForm } from "@/components/capsules/capsule-form";
import { LockedCapsuleCard, ReopenedCapsuleCard } from "@/components/capsules/capsule-cards";
import { CapsuleReopenCard } from "@/components/capsules/capsule-reopen-card";
import { FlowSteps } from "@/components/layout/flow-steps";
import { PageHeader } from "@/components/layout/page-header";
import { PageSection } from "@/components/layout/page-section";
import { EmptyState } from "@/components/shared/empty-state";
import { buttonVariants } from "@/components/ui/button";
import { getCapsuleOverview } from "@/lib/capsules/queries";
import { ROUTES } from "@/lib/constants/routes";
import { listThoughtOptions } from "@/lib/thoughts/options";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Worry Capsules" };

const FLOW = ["Create capsule", "Select thought", "Set intensity", "Choose reopen date", "Locked until then"] as const;

export default async function WorryCapsulesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const [overview, thoughts, params] = await Promise.all([getCapsuleOverview(), listThoughtOptions(), searchParams]);

  const requested = Array.isArray(params.thought) ? params.thought[0] : params.thought;
  const initialThoughtId = thoughts.some((thought) => thought.id === requested) ? requested : undefined;

  return (
    <div className="space-y-8">
      <PageHeader
        className="mb-0 sm:mb-0"
        title="Worry Capsules"
        description="Set a worry aside now. Open it later and see how it looks from there."
      />

      <FlowSteps label="How capsules work" steps={FLOW} />

      {thoughts.length === 0 ? (
        <EmptyState
          icon={FlaskConical}
          title="Start with a thought"
          description="A capsule holds one of your thoughts. Analyse a thought in the Thought Lab first, then come back to seal it."
          action={
            <Link href={ROUTES.newThought} className={cn(buttonVariants())}>
              Analyse a thought
            </Link>
          }
        />
      ) : (
        <div className="grid gap-6 lg:grid-cols-[minmax(0,26rem)_minmax(0,1fr)] lg:items-start">
          <CapsuleForm thoughts={thoughts} initialThoughtId={initialThoughtId} />

          <div className="space-y-8">
            {overview.total === 0 ? (
              <EmptyState
                icon={Hourglass}
                title="No capsules yet"
                description="Pick a thought that keeps coming back, note how strong it feels, and lock it away until a day you choose."
              />
            ) : null}

            {overview.ready.length > 0 ? (
              <PageSection title="Ready to open" description="The wait is over. Compare then with now.">
                <div className="space-y-4">
                  {overview.ready.map((capsule) => (
                    <CapsuleReopenCard key={capsule.id} capsule={capsule} />
                  ))}
                </div>
              </PageSection>
            ) : null}

            {overview.locked.length > 0 ? (
              <PageSection title="Sealed" description="Locked until the date shown.">
                <ul className="grid gap-4 sm:grid-cols-2">
                  {overview.locked.map((capsule) => (
                    <li key={capsule.id}>
                      <LockedCapsuleCard capsule={capsule} />
                    </li>
                  ))}
                </ul>
              </PageSection>
            ) : null}

            {overview.reopened.length > 0 ? (
              <PageSection title="Opened" description="Then and now, side by side.">
                <ul className="space-y-4">
                  {overview.reopened.map((capsule) => (
                    <li key={capsule.id}>
                      <ReopenedCapsuleCard capsule={capsule} />
                    </li>
                  ))}
                </ul>
              </PageSection>
            ) : null}
          </div>
        </div>
      )}

      <p className="text-xs text-muted-foreground">
        MindLoop Lab is a self-reflection tool and is not a substitute for professional mental health care.
      </p>
    </div>
  );
}
