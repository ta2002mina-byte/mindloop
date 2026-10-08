"use client";

import { Check, Info, Sparkles, Trash2, X } from "lucide-react";
import { useId, useState } from "react";

import { FormAlert } from "@/components/forms/form-alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { analyzeThought } from "@/lib/ai/actions";
import { AI_DISCLAIMER } from "@/lib/ai/prompt";
import type { ThoughtAnalysis } from "@/lib/ai/types";
import { draftItemId, type DraftListItem, type ThoughtDraft } from "@/lib/thoughts/draft";
import { cn } from "@/lib/utils";

interface AiAnalysisPanelProps {
  draft: ThoughtDraft;
  update: (patch: Partial<ThoughtDraft>) => void;
}

/** Every suggestion is a row the user can edit, untick or delete before applying. */
interface EditableItem {
  id: string;
  content: string;
  include: boolean;
}

interface PanelState {
  trigger: EditableItem | null;
  mainThought: string;
  facts: EditableItem[];
  assumptions: EditableItem[];
  action: EditableItem | null;
  questions: string[];
  loopIndicators: string[];
  providerLabel: string;
}

function toItems(values: readonly string[]): EditableItem[] {
  return values.map((content) => ({ id: draftItemId(), content, include: true }));
}

function toPanelState(analysis: ThoughtAnalysis, providerLabel: string): PanelState {
  return {
    trigger: analysis.trigger ? { id: draftItemId(), content: analysis.trigger, include: true } : null,
    mainThought: analysis.mainThought,
    facts: toItems(analysis.observableFacts),
    assumptions: toItems(analysis.possibleAssumptions),
    action: analysis.suggestedSmallAction
      ? { id: draftItemId(), content: analysis.suggestedSmallAction, include: true }
      : null,
    questions: analysis.reflectionQuestions,
    loopIndicators: analysis.possibleLoopIndicators,
    providerLabel,
  };
}

/** Items the user kept, as draft rows. */
function keptAsDraftItems(items: readonly EditableItem[]): DraftListItem[] {
  return items
    .filter((item) => item.include && item.content.trim().length >= 3)
    .map((item) => ({ id: draftItemId(), content: item.content.trim() }));
}

export function AiAnalysisPanel({ draft, update }: AiAnalysisPanelProps) {
  const [panel, setPanel] = useState<PanelState | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [applied, setApplied] = useState(false);
  const headingId = useId();

  const canAnalyse = draft.rawText.trim().length >= 20;

  const run = async () => {
    setLoading(true);
    setError(null);
    setApplied(false);

    try {
      const result = await analyzeThought({
        rawText: draft.rawText,
        trigger: draft.trigger || undefined,
        category: draft.category || undefined,
      });

      if (!result.ok) {
        setError(result.message);
        return;
      }
      setPanel(toPanelState(result.data.analysis, result.data.providerLabel));
    } catch (caught) {
      console.error("[ai-panel] Analysis request failed:", caught);
      setError("We couldn't run the analysis. Carry on filling the steps yourself, or try again.");
    } finally {
      setLoading(false);
    }
  };

  const apply = () => {
    if (!panel) return;

    const patch: Partial<ThoughtDraft> = {};

    const facts = keptAsDraftItems(panel.facts);
    if (facts.length) patch.facts = [...draft.facts, ...facts];

    const stories = keptAsDraftItems(panel.assumptions);
    if (stories.length) patch.stories = [...draft.stories, ...stories];

    const trigger = panel.trigger;
    if (trigger?.include && trigger.content.trim() && !draft.trigger.trim()) {
      patch.trigger = trigger.content.trim().slice(0, 200);
    }

    const action = panel.action;
    if (action?.include && action.content.trim() && !draft.action.title.trim()) {
      patch.action = { ...draft.action, title: action.content.trim().slice(0, 200) };
    }

    update(patch);
    setApplied(true);
    setPanel(null);
  };

  return (
    <Card className="border-dashed">
      <CardHeader className="flex-row items-start justify-between gap-3 space-y-0">
        <div className="space-y-1.5">
          <CardTitle id={headingId} className="flex items-center gap-2 text-base">
            <Sparkles className="h-4 w-4 text-primary" aria-hidden="true" />
            Analyze with AI
          </CardTitle>
          <CardDescription>
            Optional. It suggests a split of facts and assumptions, some questions and one small step. You edit
            everything before any of it is applied.
          </CardDescription>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {error ? <FormAlert variant="error">{error}</FormAlert> : null}
        {applied ? (
          <FormAlert variant="success" title="Applied">
            The suggestions you kept are now in your Fact, Story and Next Action steps. Edit them there as usual.
          </FormAlert>
        ) : null}

        {panel === null ? (
          <div className="flex flex-wrap items-center gap-3">
            <Button type="button" variant="outline" onClick={() => void run()} loading={loading} disabled={!canAnalyse}>
              {loading ? "Reading your thought…" : "Analyze with AI"}
            </Button>
            {!canAnalyse ? (
              <p className="text-sm text-muted-foreground">Write a bit more of the thought to enable this.</p>
            ) : null}
          </div>
        ) : (
          <div className="space-y-5" aria-labelledby={headingId}>
            <p className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
              <Badge variant="outline">{panel.providerLabel}</Badge>
              Suggestions only. Nothing is saved yet.
            </p>

            {panel.mainThought ? (
              <Section title="One possible reading of the main thought">
                <p className="break-anywhere rounded-xl border bg-muted/30 px-3.5 py-3 text-sm">{panel.mainThought}</p>
              </Section>
            ) : null}

            {panel.trigger ? (
              <Section
                title="Trigger"
                hint={draft.trigger.trim() ? "You already noted a trigger, so this will not overwrite it." : undefined}
              >
                <SingleLineSuggestion
                  item={panel.trigger}
                  label="Suggested trigger"
                  maxLength={200}
                  disabled={Boolean(draft.trigger.trim())}
                  onChange={(next) => setPanel({ ...panel, trigger: next })}
                />
              </Section>
            ) : null}

            <Section
              title="Observable facts"
              hint="These go to your Fact list. Keep only what someone else could confirm."
            >
              <EditableList
                items={panel.facts}
                emptyText="Nothing in the text looked like a checkable fact."
                onChange={(facts) => setPanel({ ...panel, facts })}
              />
            </Section>

            <Section title="Possible assumptions" hint="These go to your Story list.">
              <EditableList
                items={panel.assumptions}
                emptyText="No assumptions were picked out."
                onChange={(assumptions) => setPanel({ ...panel, assumptions })}
              />
            </Section>

            {panel.questions.length ? (
              <Section title="Questions worth asking" hint="Yours to sit with. Not saved anywhere.">
                <ul className="space-y-2 text-sm">
                  {panel.questions.map((question) => (
                    <li key={question} className="flex gap-2">
                      <span aria-hidden="true" className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-primary/60" />
                      <span className="break-anywhere">{question}</span>
                    </li>
                  ))}
                </ul>
              </Section>
            ) : null}

            {panel.loopIndicators.length ? (
              <Section
                title="Possible loop indicators"
                hint="Notes about the wording of this entry. The Traffic Light stays your call."
              >
                <ul className="space-y-2 text-sm text-muted-foreground">
                  {panel.loopIndicators.map((indicator) => (
                    <li key={indicator} className="flex gap-2">
                      <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                      <span className="break-anywhere">{indicator}</span>
                    </li>
                  ))}
                </ul>
              </Section>
            ) : null}

            {panel.action ? (
              <Section
                title="A small step you may want to consider"
                hint={
                  draft.action.title.trim()
                    ? "You already wrote an action, so this will not overwrite it."
                    : "This fills the Next Action step."
                }
              >
                <SingleLineSuggestion
                  item={panel.action}
                  label="Suggested action"
                  maxLength={200}
                  disabled={Boolean(draft.action.title.trim())}
                  onChange={(next) => setPanel({ ...panel, action: next })}
                />
              </Section>
            ) : null}

            <div className="flex flex-wrap gap-2 border-t pt-4">
              <Button type="button" onClick={apply}>
                <Check aria-hidden="true" />
                Apply what I kept
              </Button>
              <Button type="button" variant="ghost" onClick={() => setPanel(null)}>
                <X aria-hidden="true" />
                Discard
              </Button>
            </div>

            <p className="text-xs text-muted-foreground">{AI_DISCLAIMER}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function Section({ title, hint, children }: { title: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <div className="space-y-0.5">
        <h4 className="text-sm font-medium">{title}</h4>
        {hint ? <p className="text-xs text-muted-foreground">{hint}</p> : null}
      </div>
      {children}
    </div>
  );
}

function SingleLineSuggestion({
  item,
  label,
  maxLength,
  disabled,
  onChange,
}: {
  item: EditableItem;
  label: string;
  maxLength: number;
  disabled: boolean;
  onChange: (item: EditableItem) => void;
}) {
  const fieldId = useId();

  return (
    <div className="space-y-2">
      <Label htmlFor={fieldId} className="sr-only">
        {label}
      </Label>
      <div className="flex items-center gap-2">
        <IncludeToggle
          checked={item.include && !disabled}
          disabled={disabled}
          label={label}
          onChange={(include) => onChange({ ...item, include })}
        />
        <Input
          id={fieldId}
          value={item.content}
          maxLength={maxLength}
          onChange={(event) => onChange({ ...item, content: event.target.value })}
        />
      </div>
    </div>
  );
}

function EditableList({
  items,
  emptyText,
  onChange,
}: {
  items: EditableItem[];
  emptyText: string;
  onChange: (items: EditableItem[]) => void;
}) {
  if (items.length === 0) {
    return <p className="rounded-xl border border-dashed px-3 py-3 text-sm text-muted-foreground">{emptyText}</p>;
  }

  return (
    <ul className="space-y-2">
      {items.map((item) => (
        <li key={item.id} className="flex items-start gap-2">
          <div className="pt-2.5">
            <IncludeToggle
              checked={item.include}
              disabled={false}
              label={`Keep “${item.content.slice(0, 40)}”`}
              onChange={(include) =>
                onChange(items.map((entry) => (entry.id === item.id ? { ...entry, include } : entry)))
              }
            />
          </div>
          <Input
            value={item.content}
            maxLength={500}
            aria-label="Suggestion"
            className={cn(!item.include && "opacity-60")}
            onChange={(event) =>
              onChange(items.map((entry) => (entry.id === item.id ? { ...entry, content: event.target.value } : entry)))
            }
          />
          <button
            type="button"
            onClick={() => onChange(items.filter((entry) => entry.id !== item.id))}
            className="mt-2 shrink-0 rounded-lg p-1 text-muted-foreground transition-colors hover:bg-background hover:text-destructive focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <Trash2 className="h-4 w-4" aria-hidden="true" />
            <span className="sr-only">Remove this suggestion</span>
          </button>
        </li>
      ))}
    </ul>
  );
}

function IncludeToggle({
  checked,
  disabled,
  label,
  onChange,
}: {
  checked: boolean;
  disabled: boolean;
  label: string;
  onChange: (checked: boolean) => void;
}) {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={cn(
        "flex h-5 w-5 shrink-0 items-center justify-center rounded-md border transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-40",
        checked ? "border-primary bg-primary text-primary-foreground" : "border-input bg-card hover:border-primary",
      )}
    >
      {checked ? <Check className="h-3.5 w-3.5" aria-hidden="true" /> : null}
    </button>
  );
}
