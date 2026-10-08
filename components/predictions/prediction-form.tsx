"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { FormAlert } from "@/components/forms/form-alert";
import { SelectField } from "@/components/forms/select-field";
import { TextField } from "@/components/forms/text-field";
import { TextareaField } from "@/components/forms/textarea-field";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { describeConfidence } from "@/lib/constants/phase3";
import { createPrediction } from "@/lib/predictions/actions";
import { createPredictionSchema } from "@/lib/validations/prediction";
import type { ThoughtOption } from "@/types";
import { dateInputInDays, formatDateOnly, todayAsDateInput } from "@/utils/date";

interface PredictionFormProps {
  thoughts: ThoughtOption[];
  initialThoughtId?: string;
}

type FieldErrors = Partial<Record<"thoughtId" | "predictionText" | "expectedDate", string>>;

const MAX_TEXT = 500;

export function PredictionForm({ thoughts, initialThoughtId }: PredictionFormProps) {
  const router = useRouter();
  const [thoughtId, setThoughtId] = useState(initialThoughtId ?? "");
  const [text, setText] = useState("");
  const [confidence, setConfidence] = useState(50);
  // Dates depend on the visitor's clock, so they are filled in after mount to keep server and client markup identical.
  const [expectedDate, setExpectedDate] = useState("");
  const [minDate, setMinDate] = useState<string | undefined>(undefined);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [savedFor, setSavedFor] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    setMinDate(todayAsDateInput());
    setExpectedDate((current) => current || dateInputInDays(7));
  }, []);

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormError(null);
    setSavedFor(null);

    const parsed = createPredictionSchema.safeParse({ thoughtId, predictionText: text, confidence, expectedDate });
    if (!parsed.success) {
      const next: FieldErrors = {};
      for (const issue of parsed.error.issues) {
        const key = issue.path[0];
        if ((key === "thoughtId" || key === "predictionText" || key === "expectedDate") && !next[key]) next[key] = issue.message;
      }
      setErrors(next);
      return;
    }
    setErrors({});

    setPending(true);
    const result = await createPrediction(parsed.data);
    setPending(false);

    if (!result.ok) {
      setFormError(result.message);
      return;
    }

    setSavedFor(parsed.data.expectedDate);
    setText("");
    setConfidence(50);
    setExpectedDate(dateInputInDays(7));
    router.refresh();
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Write a prediction</CardTitle>
        <CardDescription>
          Say what you expect to happen and how sure you are. Come back on the date to see how it actually went.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={(event) => void submit(event)} noValidate className="space-y-5">
          {formError ? <FormAlert variant="error">{formError}</FormAlert> : null}
          {savedFor ? (
            <FormAlert variant="success" title="Prediction saved">
              It will be ready to review on {formatDateOnly(savedFor)}.
            </FormAlert>
          ) : null}

          <SelectField
            label="Which thought is this about?"
            value={thoughtId}
            error={errors.thoughtId}
            onChange={(event) => setThoughtId(event.target.value)}
          >
            <option value="">Choose a thought…</option>
            {thoughts.map((thought) => (
              <option key={thought.id} value={thought.id}>
                {thought.title}
              </option>
            ))}
          </SelectField>

          <TextareaField
            label="What do you predict will happen?"
            value={text}
            rows={3}
            maxLength={MAX_TEXT}
            maxChars={MAX_TEXT}
            currentChars={text.length}
            placeholder="e.g. My manager will say the report needs a full rewrite."
            error={errors.predictionText}
            onChange={(event) => setText(event.target.value)}
          />

          <div className="space-y-2">
            <div className="flex items-baseline justify-between gap-3">
              <Label htmlFor="prediction-confidence">How confident are you?</Label>
              <span className="text-sm tabular-nums text-muted-foreground">
                {confidence}%, {describeConfidence(confidence).toLowerCase()}
              </span>
            </div>
            <Slider
              id="prediction-confidence"
              min={0}
              max={100}
              step={5}
              value={confidence}
              aria-valuetext={`${confidence} percent, ${describeConfidence(confidence)}`}
              onChange={(event) => setConfidence(Number(event.target.value))}
            />
          </div>

          <TextField
            label="When will you know?"
            type="date"
            value={expectedDate}
            min={minDate}
            error={errors.expectedDate}
            hint="The day you expect to find out how it went."
            onChange={(event) => setExpectedDate(event.target.value)}
          />

          <Button type="submit" loading={pending} className="w-full sm:w-auto">
            Save prediction
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
