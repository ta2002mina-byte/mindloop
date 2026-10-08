"use client";

import { LockOpen } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { IntensityBar } from "@/components/capsules/intensity-bar";
import { FormAlert } from "@/components/forms/form-alert";
import { TextareaField } from "@/components/forms/textarea-field";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { reopenCapsule } from "@/lib/capsules/actions";
import { describeIntensityChange } from "@/lib/capsules/compare";
import { thoughtRoute } from "@/lib/constants/routes";
import { describeIntensity } from "@/lib/constants/thoughts";
import type { CapsuleView } from "@/types";
import { formatDate } from "@/utils/date";

const MAX_TEXT = 1000;

/** The capsule is open: THEN is shown, and NOW is filled in before anything is saved. */
export function CapsuleReopenCard({ capsule }: { capsule: CapsuleView }) {
  const router = useRouter();
  const [current, setCurrent] = useState(capsule.worryIntensity ?? 5);
  const [outcome, setOutcome] = useState("");
  const [whatChanged, setWhatChanged] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setPending(true);
    setError(null);
    const result = await reopenCapsule({ id: capsule.id, currentIntensity: current, outcome, whatChanged });
    setPending(false);

    if (!result.ok) {
      setError(result.message);
      return;
    }
    router.refresh();
  };

  const inputId = `current-${capsule.id}`;

  return (
    <Card className="border-signal/50">
      <CardHeader>
        <p className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-signal">
          <LockOpen className="h-4 w-4" aria-hidden="true" />
          Ready to open
        </p>
        <CardTitle className="text-base">
          <Link href={thoughtRoute(capsule.thoughtId)} className="break-anywhere underline-offset-4 hover:underline">
            {capsule.thoughtTitle}
          </Link>
        </CardTitle>
        <CardDescription>You sealed this on {formatDate(capsule.createdAt)}. Here is what you left for yourself.</CardDescription>
      </CardHeader>

      <CardContent>
        <form onSubmit={(event) => void submit(event)} noValidate className="space-y-5">
          <section aria-label="Then" className="space-y-3 rounded-2xl border bg-muted/30 p-4">
            <h4 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Then</h4>
            {capsule.thoughtText ? (
              <p className="break-anywhere whitespace-pre-wrap text-sm leading-relaxed">{capsule.thoughtText}</p>
            ) : null}
            {capsule.worryIntensity !== null ? (
              <IntensityBar label="Original intensity" value={capsule.worryIntensity} barClassName="bg-muted-foreground/60" />
            ) : null}
          </section>

          <section aria-label="Now" className="space-y-4 rounded-2xl border border-signal/40 bg-signal/5 p-4">
            <h4 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Now</h4>

            {error ? <FormAlert variant="error">{error}</FormAlert> : null}

            <div className="space-y-2">
              <div className="flex items-baseline justify-between gap-3">
                <Label htmlFor={inputId}>How intense does it feel today?</Label>
                <span className="shrink-0 text-sm tabular-nums text-muted-foreground">
                  {current} / 10, {describeIntensity(current).toLowerCase()}
                </span>
              </div>
              <Slider
                id={inputId}
                min={1}
                max={10}
                step={1}
                value={current}
                aria-valuetext={`${current} out of 10, ${describeIntensity(current)}`}
                onChange={(event) => setCurrent(Number(event.target.value))}
              />
              {capsule.worryIntensity !== null ? (
                <p className="text-sm text-muted-foreground">{describeIntensityChange(capsule.worryIntensity, current)}</p>
              ) : null}
            </div>

            <TextareaField
              label="What happened?"
              value={outcome}
              rows={3}
              maxLength={MAX_TEXT}
              maxChars={MAX_TEXT}
              currentChars={outcome.length}
              onChange={(event) => setOutcome(event.target.value)}
            />

            <TextareaField
              label="What changed?"
              value={whatChanged}
              rows={3}
              maxLength={MAX_TEXT}
              maxChars={MAX_TEXT}
              currentChars={whatChanged.length}
              hint="Anything different about the situation, or about how you see it."
              onChange={(event) => setWhatChanged(event.target.value)}
            />
          </section>

          <Button type="submit" loading={pending}>
            Open capsule and save
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
