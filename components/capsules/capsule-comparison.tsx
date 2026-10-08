import { ArrowRight } from "lucide-react";

import { IntensityBar } from "@/components/capsules/intensity-bar";
import { describeIntensityChange } from "@/lib/capsules/compare";
import { cn } from "@/lib/utils";
import type { CapsuleView } from "@/types";
import { formatDate } from "@/utils/date";

/** THEN on the left, NOW on the right, and a plain sentence about the difference. */
export function CapsuleComparison({ capsule }: { capsule: CapsuleView }) {
  if (capsule.worryIntensity === null || capsule.currentIntensity === null) return null;

  return (
    <div className="space-y-4">
      <div className="grid items-stretch gap-3 md:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)]">
        <section aria-label="Then" className="space-y-3 rounded-2xl border bg-muted/30 p-4">
          <h4 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Then{capsule.createdAt ? `, ${formatDate(capsule.createdAt)}` : ""}
          </h4>
          {capsule.thoughtText ? <p className="break-anywhere whitespace-pre-wrap text-sm leading-relaxed">{capsule.thoughtText}</p> : null}
          <IntensityBar label="Original intensity" value={capsule.worryIntensity} barClassName="bg-muted-foreground/60" />
        </section>

        <div aria-hidden="true" className="flex items-center justify-center text-primary/60">
          <ArrowRight className="h-5 w-5 rotate-90 md:rotate-0" />
        </div>

        <section aria-label="Now" className="space-y-3 rounded-2xl border border-signal/40 bg-signal/5 p-4">
          <h4 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Now{capsule.reopenedAt ? `, ${formatDate(capsule.reopenedAt)}` : ""}
          </h4>
          <IntensityBar label="Current intensity" value={capsule.currentIntensity} barClassName="bg-signal" />
          <div className={cn("space-y-3 text-sm", !capsule.outcome && !capsule.whatChanged && "hidden")}>
            {capsule.outcome ? (
              <div className="space-y-0.5">
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">What happened</p>
                <p className="break-anywhere whitespace-pre-wrap leading-relaxed">{capsule.outcome}</p>
              </div>
            ) : null}
            {capsule.whatChanged ? (
              <div className="space-y-0.5">
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">What changed</p>
                <p className="break-anywhere whitespace-pre-wrap leading-relaxed">{capsule.whatChanged}</p>
              </div>
            ) : null}
          </div>
        </section>
      </div>

      <p className="rounded-xl border bg-muted/30 px-3.5 py-2.5 text-sm text-muted-foreground">
        {describeIntensityChange(capsule.worryIntensity, capsule.currentIntensity)}
      </p>
    </div>
  );
}
