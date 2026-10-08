"use client";

import { Plus, X } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { EMOTION_OPTIONS, describeIntensity } from "@/lib/constants/thoughts";
import { draftItemId, type DraftEmotion, type ThoughtDraft } from "@/lib/thoughts/draft";
import type { StepErrors } from "@/lib/thoughts/wizard";
import { cn } from "@/lib/utils";

interface StepProps {
  draft: ThoughtDraft;
  update: (patch: Partial<ThoughtDraft>) => void;
  errors: StepErrors;
}

const MAX_EMOTIONS = 10;

export function StepEmotion({ draft, update, errors }: StepProps) {
  const [customValue, setCustomValue] = useState("");
  const selected = draft.emotions;
  const atLimit = selected.length >= MAX_EMOTIONS;

  const setEmotions = (emotions: DraftEmotion[]) => update({ emotions });

  const toggle = (emotion: string) => {
    const existing = selected.find((item) => item.emotion === emotion);
    if (existing) {
      setEmotions(selected.filter((item) => item.id !== existing.id));
      return;
    }
    if (atLimit) return;
    setEmotions([...selected, { id: draftItemId(), emotion, intensity: 5, isCustom: false }]);
  };

  const addCustom = () => {
    const emotion = customValue.trim().slice(0, 40);
    if (!emotion || atLimit) return;
    if (selected.some((item) => item.emotion.toLowerCase() === emotion.toLowerCase())) {
      setCustomValue("");
      return;
    }
    setEmotions([...selected, { id: draftItemId(), emotion, intensity: 5, isCustom: true }]);
    setCustomValue("");
  };

  const setIntensity = (id: string, intensity: number) =>
    setEmotions(selected.map((item) => (item.id === id ? { ...item, intensity } : item)));

  return (
    <div className="max-w-2xl space-y-6">
      <fieldset className="space-y-3">
        <legend className="text-sm font-medium">Feelings</legend>
        <div className="flex flex-wrap gap-2">
          {EMOTION_OPTIONS.map((emotion) => {
            const isSelected = selected.some((item) => item.emotion === emotion);
            return (
              <button
                key={emotion}
                type="button"
                aria-pressed={isSelected}
                disabled={!isSelected && atLimit}
                onClick={() => toggle(emotion)}
                className={cn(
                  "rounded-full border px-3.5 py-1.5 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50",
                  isSelected
                    ? "border-primary bg-primary/10 font-medium text-primary"
                    : "border-border bg-card hover:bg-accent hover:text-accent-foreground",
                )}
              >
                {emotion}
              </button>
            );
          })}
        </div>
        {errors.emotions ? (
          <p role="alert" className="text-sm text-destructive">
            {errors.emotions}
          </p>
        ) : null}
      </fieldset>

      <div className="space-y-2">
        <Label htmlFor="custom-emotion">Other</Label>
        <div className="flex max-w-sm gap-2">
          <Input
            id="custom-emotion"
            value={customValue}
            maxLength={40}
            placeholder="Name it in your own words"
            disabled={atLimit}
            onChange={(event) => setCustomValue(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                addCustom();
              }
            }}
          />
          <Button type="button" variant="outline" size="icon" onClick={addCustom} disabled={atLimit || !customValue.trim()}>
            <Plus aria-hidden="true" />
            <span className="sr-only">Add this feeling</span>
          </Button>
        </div>
      </div>

      {selected.length > 0 ? (
        <ul className="space-y-4">
          {selected.map((item) => (
            <li key={item.id} className="rounded-2xl border bg-muted/30 p-4">
              <div className="flex items-center justify-between gap-3">
                <Label htmlFor={`intensity-${item.id}`} className="text-sm font-medium">
                  {item.emotion}
                </Label>
                <div className="flex items-center gap-3">
                  <span className="text-sm tabular-nums text-muted-foreground">
                    {item.intensity} / 10, {describeIntensity(item.intensity)}
                  </span>
                  <button
                    type="button"
                    onClick={() => setEmotions(selected.filter((entry) => entry.id !== item.id))}
                    className="rounded-lg p-1 text-muted-foreground transition-colors hover:bg-background hover:text-destructive focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <X className="h-4 w-4" aria-hidden="true" />
                    <span className="sr-only">Remove {item.emotion}</span>
                  </button>
                </div>
              </div>
              <Slider
                id={`intensity-${item.id}`}
                min={1}
                max={10}
                step={1}
                value={item.intensity}
                aria-valuetext={`${item.intensity} out of 10, ${describeIntensity(item.intensity)}`}
                className="mt-3"
                onChange={(event) => setIntensity(item.id, Number(event.target.value))}
              />
            </li>
          ))}
        </ul>
      ) : (
        <p className="rounded-xl border border-dashed px-3 py-4 text-center text-sm text-muted-foreground">
          Pick a feeling above to set how strong it is.
        </p>
      )}

      <p className="text-xs text-muted-foreground">
        These are your own words for how this feels. They are not a measure of anything clinical.
      </p>
    </div>
  );
}
