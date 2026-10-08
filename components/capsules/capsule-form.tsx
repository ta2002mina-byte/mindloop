"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { FormAlert } from "@/components/forms/form-alert";
import { SelectField } from "@/components/forms/select-field";
import { TextField } from "@/components/forms/text-field";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { createCapsule } from "@/lib/capsules/actions";
import { REOPEN_PRESETS, type ReopenPreset } from "@/lib/constants/phase3";
import { describeIntensity } from "@/lib/constants/thoughts";
import { createCapsuleSchema } from "@/lib/validations/capsule";
import { cn } from "@/lib/utils";
import type { ThoughtOption } from "@/types";
import { addDaysUtc, formatDateOnly, todayUtc } from "@/utils/date";

interface CapsuleFormProps {
  thoughts: ThoughtOption[];
  initialThoughtId?: string;
}

type FieldErrors = Partial<Record<"thoughtId" | "customDate", string>>;

export function CapsuleForm({ thoughts, initialThoughtId }: CapsuleFormProps) {
  const router = useRouter();
  const [thoughtId, setThoughtId] = useState(initialThoughtId ?? "");
  const [intensity, setIntensity] = useState(5);
  const [preset, setPreset] = useState<ReopenPreset>("three_days");
  const [customDate, setCustomDate] = useState("");
  const [errors, setErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [sealedUntil, setSealedUntil] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  // Known only in the browser, so it is set after mount to keep server and client markup identical.
  const [today, setToday] = useState<string | null>(null);

  useEffect(() => setToday(todayUtc()), []);

  const selectedPreset = REOPEN_PRESETS.find((item) => item.value === preset);
  const previewDate =
    today && selectedPreset?.days != null ? addDaysUtc(today, selectedPreset.days) : preset === "custom" && customDate ? customDate : null;

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormError(null);
    setSealedUntil(null);

    const parsed = createCapsuleSchema.safeParse({ thoughtId, worryIntensity: intensity, preset, customDate });
    if (!parsed.success) {
      const next: FieldErrors = {};
      for (const issue of parsed.error.issues) {
        const key = issue.path[0];
        if ((key === "thoughtId" || key === "customDate") && !next[key]) next[key] = issue.message;
      }
      setErrors(next);
      return;
    }
    setErrors({});

    setPending(true);
    const result = await createCapsule(parsed.data);
    setPending(false);

    if (!result.ok) {
      setFormError(result.message);
      return;
    }

    setSealedUntil(result.data.reopenDate);
    setThoughtId("");
    setIntensity(5);
    router.refresh();
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Seal a worry</CardTitle>
        <CardDescription>
          Set one thought aside and lock it. It stays closed until the day you choose, then you compare how it feels
          then and now.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={(event) => void submit(event)} noValidate className="space-y-5">
          {formError ? <FormAlert variant="error">{formError}</FormAlert> : null}
          {sealedUntil ? (
            <FormAlert variant="success" title="Capsule sealed">
              It stays locked until {formatDateOnly(sealedUntil)}.
            </FormAlert>
          ) : null}

          <SelectField
            label="Which thought are you sealing?"
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

          <div className="space-y-2">
            <div className="flex items-baseline justify-between gap-3">
              <Label htmlFor="capsule-intensity">How intense does this worry feel right now?</Label>
              <span className="shrink-0 text-sm tabular-nums text-muted-foreground">
                {intensity} / 10, {describeIntensity(intensity).toLowerCase()}
              </span>
            </div>
            <Slider
              id="capsule-intensity"
              min={1}
              max={10}
              step={1}
              value={intensity}
              aria-valuetext={`${intensity} out of 10, ${describeIntensity(intensity)}`}
              onChange={(event) => setIntensity(Number(event.target.value))}
            />
          </div>

          <fieldset className="space-y-3">
            <legend className="text-sm font-medium">Reopen it in</legend>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {REOPEN_PRESETS.map((option) => (
                <label key={option.value} className="relative block cursor-pointer">
                  <input
                    type="radio"
                    name="reopen-preset"
                    value={option.value}
                    checked={preset === option.value}
                    onChange={() => setPreset(option.value)}
                    className="peer sr-only"
                  />
                  <span
                    className={cn(
                      "flex h-11 items-center justify-center rounded-xl border bg-card px-2 text-sm transition-colors hover:bg-accent/40",
                      "peer-focus-visible:ring-2 peer-focus-visible:ring-ring peer-focus-visible:ring-offset-2 peer-focus-visible:ring-offset-background",
                      preset === option.value && "border-primary bg-primary/10 font-medium text-primary",
                    )}
                  >
                    {option.label}
                  </span>
                </label>
              ))}
            </div>

            {preset === "custom" ? (
              <TextField
                label="Reopen on"
                type="date"
                value={customDate}
                min={today ? addDaysUtc(today, 1) : undefined}
                max={today ? addDaysUtc(today, 365) : undefined}
                error={errors.customDate}
                onChange={(event) => setCustomDate(event.target.value)}
              />
            ) : null}

            {previewDate ? (
              <p className="text-sm text-muted-foreground">
                It will open on <span className="font-medium text-foreground">{formatDateOnly(previewDate)}</span>.
              </p>
            ) : null}
          </fieldset>

          <Button type="submit" loading={pending} className="w-full sm:w-auto">
            Seal capsule
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
