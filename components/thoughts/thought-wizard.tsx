"use client";

import { ArrowLeft, ArrowRight, Check, Cloud, CloudOff, Loader2, Save } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { FormAlert } from "@/components/forms/form-alert";
import { StepControlMap } from "@/components/thoughts/steps/step-control-map";
import { StepEmotion } from "@/components/thoughts/steps/step-emotion";
import { StepFactStory } from "@/components/thoughts/steps/step-fact-story";
import { StepNextAction } from "@/components/thoughts/steps/step-next-action";
import { StepReview } from "@/components/thoughts/steps/step-review";
import { StepSituation } from "@/components/thoughts/steps/step-situation";
import { StepThought } from "@/components/thoughts/steps/step-thought";
import { StepTrafficLight } from "@/components/thoughts/steps/step-traffic-light";
import { WizardStepper } from "@/components/thoughts/wizard-stepper";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useThoughtDraft } from "@/hooks/use-thought-draft";
import { thoughtRoute } from "@/lib/constants/routes";
import { createThought, updateThought } from "@/lib/thoughts/actions";
import { createEmptyDraft, type ThoughtDraft } from "@/lib/thoughts/draft";
import {
  REVIEW_STEP_INDEX,
  STEP_COUNT,
  WIZARD_STEPS,
  firstInvalidStep,
  type StepErrors,
  validateStep,
} from "@/lib/thoughts/wizard";

interface ThoughtWizardProps {
  /** Omit to create a new thought; pass an id to edit an existing one. */
  thoughtId?: string;
  initialDraft?: ThoughtDraft;
}

export function ThoughtWizard({ thoughtId, initialDraft }: ThoughtWizardProps) {
  const router = useRouter();
  const isEditing = Boolean(thoughtId);

  // useMemo keeps the same object identity, so the draft hook does not reset.
  const initial = useMemo(() => initialDraft ?? createEmptyDraft(), [initialDraft]);
  const { draft, setDraft, hydrated, status, restoredAt, saveNow, clear, discardRestored } = useThoughtDraft(
    thoughtId ?? "new",
    initial,
  );

  const [stepIndex, setStepIndex] = useState(0);
  const [furthest, setFurthest] = useState(0);
  const [errors, setErrors] = useState<StepErrors>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [draftSavedNote, setDraftSavedNote] = useState(false);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const hasMoved = useRef(false);

  const step = WIZARD_STEPS[stepIndex];
  const isReview = stepIndex === REVIEW_STEP_INDEX;

  // When editing, every step is already filled in, so the whole trail is open.
  useEffect(() => {
    if (isEditing) setFurthest(REVIEW_STEP_INDEX);
  }, [isEditing]);

  // Move focus to the step heading on navigation, but never on first paint.
  useEffect(() => {
    if (!hasMoved.current) return;
    headingRef.current?.focus();
  }, [stepIndex]);

  const update = useCallback(
    (patch: Partial<ThoughtDraft>) => {
      setDraft((current) => ({ ...current, ...patch }));
      setErrors({});
      setServerError(null);
      setDraftSavedNote(false);
    },
    [setDraft],
  );

  const goTo = (index: number) => {
    const target = Math.min(Math.max(index, 0), STEP_COUNT - 1);
    if (target === stepIndex) return;

    // Going forward requires everything before the target to be valid.
    if (target > stepIndex) {
      const invalid = firstInvalidStep(draft, target);
      if (invalid !== null) {
        setErrors(validateStep(invalid, draft));
        setStepIndex(invalid);
        hasMoved.current = true;
        return;
      }
    }

    setErrors({});
    setFurthest((value) => Math.max(value, target));
    setStepIndex(target);
    hasMoved.current = true;
  };

  const handleContinue = () => {
    const stepErrors = validateStep(stepIndex, draft);
    if (Object.keys(stepErrors).length > 0) {
      setErrors(stepErrors);
      return;
    }
    goTo(stepIndex + 1);
  };

  const handleSaveDraft = () => {
    saveNow();
    setDraftSavedNote(true);
  };

  const handleSubmit = async () => {
    const invalid = firstInvalidStep(draft, REVIEW_STEP_INDEX);
    if (invalid !== null) {
      setErrors(validateStep(invalid, draft));
      setStepIndex(invalid);
      hasMoved.current = true;
      return;
    }

    setSubmitting(true);
    setServerError(null);

    try {
      const result = thoughtId ? await updateThought(thoughtId, draft) : await createThought(draft);

      if (!result.ok) {
        setServerError(result.message);
        setSubmitting(false);
        return;
      }

      // The local draft has served its purpose; the database now holds it.
      clear();
      router.replace(thoughtRoute(result.data.id));
    } catch (caught) {
      console.error("[thought-wizard] Save failed:", caught);
      setServerError("We couldn't reach the server. Check your connection and try again.");
      setSubmitting(false);
    }
  };

  const stepProps = { draft, update, errors };

  return (
    <div className="space-y-4 sm:space-y-6">
      <Card>
        <CardContent className="space-y-4 p-4 sm:p-5">
          <WizardStepper current={stepIndex} furthest={furthest} onSelect={goTo} />
          <div className="flex items-center justify-between gap-3 border-t pt-3">
            <DraftStatus status={status} hydrated={hydrated} saved={draftSavedNote} />
            <Button type="button" variant="ghost" size="sm" onClick={handleSaveDraft} disabled={status === "unavailable"}>
              <Save aria-hidden="true" />
              Save draft
            </Button>
          </div>
        </CardContent>
      </Card>

      {restoredAt ? (
        <div className="flex flex-col gap-3 rounded-xl border border-primary/30 bg-primary/5 px-4 py-3 text-sm sm:flex-row sm:items-center sm:justify-between">
          <p>
            {isEditing
              ? "We brought back the unsaved edits you left on this thought."
              : "We brought back the analysis you had in progress."}
          </p>
          <Button type="button" variant="outline" size="sm" onClick={discardRestored} className="shrink-0">
            {isEditing ? "Use the saved version" : "Start fresh"}
          </Button>
        </div>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle tabIndex={-1} ref={headingRef} className="text-xl outline-none sm:text-2xl">
            {step?.title}
          </CardTitle>
          <CardDescription>{step?.description}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {serverError ? <FormAlert variant="error">{serverError}</FormAlert> : null}

          {step?.key === "situation" ? <StepSituation {...stepProps} /> : null}
          {step?.key === "thought" ? <StepThought {...stepProps} /> : null}
          {step?.key === "fact-story" ? <StepFactStory {...stepProps} /> : null}
          {step?.key === "emotion" ? <StepEmotion {...stepProps} /> : null}
          {step?.key === "control" ? <StepControlMap {...stepProps} /> : null}
          {step?.key === "traffic-light" ? <StepTrafficLight {...stepProps} /> : null}
          {step?.key === "action" ? <StepNextAction {...stepProps} /> : null}
          {step?.key === "review" ? <StepReview draft={draft} /> : null}
        </CardContent>
      </Card>

      {/* Sticky on mobile so Continue is always in reach of a thumb. */}
      <div className="sticky bottom-0 -mx-4 flex items-center justify-between gap-3 border-t bg-background/95 px-4 py-3 backdrop-blur sm:mx-0 sm:rounded-2xl sm:border sm:px-5">
        <Button type="button" variant="outline" onClick={() => goTo(stepIndex - 1)} disabled={stepIndex === 0 || submitting}>
          <ArrowLeft aria-hidden="true" />
          Back
        </Button>

        {isReview ? (
          <Button type="button" onClick={handleSubmit} loading={submitting}>
            {submitting ? "Saving…" : isEditing ? "Save changes" : "Save Thought"}
            {!submitting ? <Check aria-hidden="true" /> : null}
          </Button>
        ) : (
          <Button type="button" onClick={handleContinue}>
            {step?.key === "thought" ? "Start Analysis" : "Continue"}
            <ArrowRight aria-hidden="true" />
          </Button>
        )}
      </div>
    </div>
  );
}

function DraftStatus({
  status,
  hydrated,
  saved,
}: {
  status: ReturnType<typeof useThoughtDraft>["status"];
  hydrated: boolean;
  saved: boolean;
}) {
  if (!hydrated) {
    return <span className="text-xs text-muted-foreground">Checking for a saved draft…</span>;
  }

  if (status === "unavailable") {
    return (
      <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <CloudOff className="h-3.5 w-3.5" aria-hidden="true" />
        Drafts can&apos;t be stored in this browser. Your steps are kept until you leave the page.
      </span>
    );
  }

  return (
    <span className="flex items-center gap-1.5 text-xs text-muted-foreground" aria-live="polite">
      {status === "saving" ? (
        <>
          <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
          Saving draft…
        </>
      ) : (
        <>
          <Cloud className="h-3.5 w-3.5" aria-hidden="true" />
          {saved ? "Draft saved" : "Draft saved on this device"}
        </>
      )}
    </span>
  );
}
