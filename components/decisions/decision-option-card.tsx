"use client";

import { Check, GripVertical, Pencil, Trash2, X } from "lucide-react";
import { useState } from "react";

import { FormAlert } from "@/components/forms/form-alert";
import { TextField } from "@/components/forms/text-field";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { ItemListEditor } from "@/components/thoughts/item-list-editor";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { deleteDecisionOption, updateDecisionOption } from "@/lib/decisions/actions";
import { draftItemId, type DraftListItem } from "@/lib/thoughts/draft";
import { cn } from "@/lib/utils";
import type { DecisionOptionRow } from "@/types";

/** The six sections every option carries, in the order the product defines them. */
export const OPTION_SECTIONS = [
  {
    sectionId: "benefits",
    title: "Benefits",
    hint: "What this option would give you.",
    placeholder: "e.g. Finishes the qualification this year",
    accent: "text-emerald-700 dark:text-emerald-300",
  },
  {
    sectionId: "concerns",
    title: "Concerns",
    hint: "What worries you about it.",
    placeholder: "e.g. Two evenings a week gone",
    accent: "text-amber-700 dark:text-amber-300",
  },
  {
    sectionId: "knownFacts",
    title: "Known facts",
    hint: "Things you can check, not things you expect.",
    placeholder: "e.g. The fee is fixed until March",
    accent: "text-sky-700 dark:text-sky-300",
  },
  {
    sectionId: "unknowns",
    title: "Unknowns",
    hint: "What you do not know yet.",
    placeholder: "e.g. Whether work would cover part of it",
    accent: "text-violet-700 dark:text-violet-300",
  },
  {
    sectionId: "controllableItems",
    title: "What I can control",
    hint: "The parts that are your call.",
    placeholder: "e.g. How early I start each assignment",
    accent: "text-foreground",
  },
] as const;

type SectionKey = (typeof OPTION_SECTIONS)[number]["sectionId"];

interface EditState {
  name: string;
  firstStep: string;
  sections: Record<SectionKey, DraftListItem[]>;
}

function toItems(values: readonly string[]): DraftListItem[] {
  return values.map((content) => ({ id: draftItemId(), content }));
}

function toEditState(option: DecisionOptionRow): EditState {
  return {
    name: option.name,
    firstStep: option.first_step ?? "",
    sections: {
      benefits: toItems(option.benefits),
      concerns: toItems(option.concerns),
      knownFacts: toItems(option.known_facts),
      unknowns: toItems(option.unknowns),
      controllableItems: toItems(option.controllable_items),
    },
  };
}

function valuesFor(option: DecisionOptionRow, key: SectionKey): string[] {
  switch (key) {
    case "benefits":
      return option.benefits;
    case "concerns":
      return option.concerns;
    case "knownFacts":
      return option.known_facts;
    case "unknowns":
      return option.unknowns;
    case "controllableItems":
      return option.controllable_items;
  }
}

export function DecisionOptionCard({
  roomId,
  option,
  canDelete,
  onChanged,
}: {
  roomId: string;
  option: DecisionOptionRow;
  canDelete: boolean;
  onChanged: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [state, setState] = useState<EditState>(() => toEditState(option));
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const startEditing = () => {
    setState(toEditState(option));
    setError(null);
    setEditing(true);
  };

  const save = async () => {
    setSaving(true);
    setError(null);

    const result = await updateDecisionOption(roomId, option.id, {
      name: state.name,
      benefits: state.sections.benefits.map((item) => item.content),
      concerns: state.sections.concerns.map((item) => item.content),
      knownFacts: state.sections.knownFacts.map((item) => item.content),
      unknowns: state.sections.unknowns.map((item) => item.content),
      controllableItems: state.sections.controllableItems.map((item) => item.content),
      firstStep: state.firstStep,
    });

    setSaving(false);
    if (!result.ok) {
      setError(result.message);
      return;
    }
    setEditing(false);
    onChanged();
  };

  const remove = async () => {
    setDeleting(true);
    setError(null);

    const result = await deleteDecisionOption(roomId, option.id);
    setDeleting(false);
    setConfirmDelete(false);

    if (!result.ok) {
      setError(result.message);
      return;
    }
    onChanged();
  };

  return (
    <Card className="flex h-full flex-col">
      <CardHeader className="flex-row items-start justify-between gap-2 space-y-0 pb-4">
        <div className="flex min-w-0 items-start gap-2">
          <GripVertical className="mt-1 h-4 w-4 shrink-0 text-muted-foreground/60" aria-hidden="true" />
          {editing ? (
            <div className="min-w-0 flex-1">
              <TextField
                label="Option name"
                value={state.name}
                maxLength={80}
                onChange={(event) => setState({ ...state, name: event.target.value })}
              />
            </div>
          ) : (
            <h3 className="break-anywhere text-lg font-semibold leading-snug">{option.name}</h3>
          )}
        </div>

        {!editing ? (
          <div className="flex shrink-0 items-center gap-1">
            <Button type="button" variant="ghost" size="icon" onClick={startEditing} disabled={deleting}>
              <Pencil aria-hidden="true" />
              <span className="sr-only">Edit {option.name}</span>
            </Button>
            {canDelete ? (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="text-muted-foreground hover:text-destructive"
                onClick={() => setConfirmDelete(true)}
                disabled={deleting}
              >
                <Trash2 aria-hidden="true" />
                <span className="sr-only">Delete {option.name}</span>
              </Button>
            ) : null}
          </div>
        ) : null}
      </CardHeader>

      <CardContent className="flex flex-1 flex-col gap-5">
        {error ? <FormAlert variant="error">{error}</FormAlert> : null}

        {editing ? (
          <>
            {OPTION_SECTIONS.map((section) => (
              <ItemListEditor
                key={section.sectionId}
                label={section.title}
                hint={section.hint}
                placeholder={section.placeholder}
                items={state.sections[section.sectionId]}
                maxItems={12}
                maxLength={240}
                emptyText="Nothing here yet."
                onChange={(items) =>
                  setState({ ...state, sections: { ...state.sections, [section.sectionId]: items } })
                }
              />
            ))}

            <TextField
              label="First step"
              placeholder="e.g. Email the course office to ask about payment plans"
              maxLength={300}
              value={state.firstStep}
              hint="The smallest thing you could do if you went this way."
              onChange={(event) => setState({ ...state, firstStep: event.target.value })}
            />

            <div className="mt-auto flex flex-wrap gap-2 border-t pt-4">
              <Button type="button" size="sm" onClick={() => void save()} loading={saving}>
                <Check aria-hidden="true" />
                Save option
              </Button>
              <Button type="button" size="sm" variant="ghost" onClick={() => setEditing(false)} disabled={saving}>
                <X aria-hidden="true" />
                Cancel
              </Button>
            </div>
          </>
        ) : (
          <>
            {OPTION_SECTIONS.map((section) => {
              const values = valuesFor(option, section.sectionId);
              return (
                <div key={section.sectionId} className="space-y-2">
                  <h4 className={cn("text-xs font-semibold uppercase tracking-wide", section.accent)}>
                    {section.title}
                  </h4>
                  {values.length === 0 ? (
                    <p className="text-sm text-muted-foreground">Nothing noted yet.</p>
                  ) : (
                    <ul className="space-y-1.5 text-sm">
                      {values.map((value, index) => (
                        <li key={`${index}-${value.slice(0, 12)}`} className="flex gap-2">
                          <span
                            aria-hidden="true"
                            className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-muted-foreground/60"
                          />
                          <span className="break-anywhere">{value}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              );
            })}

            <div className="mt-auto border-t pt-4">
              <h4 className="text-xs font-semibold uppercase tracking-wide text-primary">First step</h4>
              <p className={cn("mt-1.5 break-anywhere text-sm", !option.first_step && "text-muted-foreground")}>
                {option.first_step || "Not written yet."}
              </p>
            </div>
          </>
        )}
      </CardContent>

      <ConfirmDialog
        open={confirmDelete}
        onOpenChange={setConfirmDelete}
        title={`Delete “${option.name}”?`}
        description="Everything written in this column goes with it. This can't be undone."
        confirmLabel="Delete option"
        loading={deleting}
        onConfirm={() => void remove()}
      />
    </Card>
  );
}
