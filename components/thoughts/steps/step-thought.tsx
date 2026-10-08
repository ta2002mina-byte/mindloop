"use client";

import { Sparkles } from "lucide-react";

import { AiAnalysisPanel } from "@/components/ai/ai-analysis-panel";
import { TextField } from "@/components/forms/text-field";
import { TextareaField } from "@/components/forms/textarea-field";
import { Button } from "@/components/ui/button";
import type { ThoughtDraft } from "@/lib/thoughts/draft";
import type { StepErrors } from "@/lib/thoughts/wizard";

interface StepProps {
  draft: ThoughtDraft;
  update: (patch: Partial<ThoughtDraft>) => void;
  errors: StepErrors;
}

/** First sentence of the thought, trimmed to something that fits a card. */
function suggestTitle(rawText: string): string {
  const firstSentence = rawText.trim().match(/^[^.?!\n]+/)?.[0] ?? rawText.trim();
  const candidate = firstSentence.replace(/\s+/g, " ").trim();
  if (candidate.length <= 120) return candidate;
  return `${candidate.slice(0, 117).trimEnd()}…`;
}

export function StepThought({ draft, update, errors }: StepProps) {
  const canSuggest = draft.rawText.trim().length >= 10;

  return (
    <div className="max-w-2xl space-y-5">
      <TextareaField
        label="The thought"
        placeholder="Write down the thought exactly as it is."
        className="min-h-40"
        maxLength={5000}
        maxChars={5000}
        currentChars={draft.rawText.length}
        value={draft.rawText}
        error={errors.rawText}
        onChange={(event) => update({ rawText: event.target.value })}
      />

      <div className="space-y-2">
        <TextField
          label="Title"
          placeholder="A short name you will recognise later"
          maxLength={120}
          value={draft.title}
          error={errors.title}
          hint="This is what shows on the card in your list."
          onChange={(event) => update({ title: event.target.value })}
        />
        {canSuggest ? (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="-ml-2 text-muted-foreground"
            onClick={() => update({ title: suggestTitle(draft.rawText) })}
          >
            <Sparkles aria-hidden="true" />
            Use the first line
          </Button>
        ) : null}
      </div>

      {/* Optional helper. The steps work exactly the same without it. */}
      <AiAnalysisPanel draft={draft} update={update} />
    </div>
  );
}
