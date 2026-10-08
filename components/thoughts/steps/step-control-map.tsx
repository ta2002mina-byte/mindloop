"use client";

import { ItemListEditor } from "@/components/thoughts/item-list-editor";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CONTROL_COLUMNS } from "@/lib/constants/thoughts";
import { type DraftListItem, type ThoughtDraft } from "@/lib/thoughts/draft";
import type { StepErrors } from "@/lib/thoughts/wizard";
import type { ControlType } from "@/types";

interface StepProps {
  draft: ThoughtDraft;
  update: (patch: Partial<ThoughtDraft>) => void;
  errors: StepErrors;
}

export function StepControlMap({ draft, update, errors }: StepProps) {
  const itemsFor = (controlType: ControlType): DraftListItem[] =>
    draft.controlItems
      .filter((item) => item.controlType === controlType)
      .map((item) => ({ id: item.id, content: item.content }));

  const setColumn = (controlType: ControlType, items: DraftListItem[]) => {
    const others = draft.controlItems.filter((item) => item.controlType !== controlType);
    update({
      controlItems: [...others, ...items.map((item) => ({ ...item, controlType }))],
    });
  };

  return (
    <div className="space-y-4">
      {errors.controlItems ? (
        <p role="alert" className="text-sm text-destructive">
          {errors.controlItems}
        </p>
      ) : null}

      {/* Three columns on desktop, stacked on mobile. */}
      <div className="grid gap-4 lg:grid-cols-3">
        {CONTROL_COLUMNS.map((column) => (
          <Card key={column.value} className={column.accent}>
            <CardHeader>
              <CardTitle className="text-base">{column.title}</CardTitle>
              <CardDescription>{column.hint}</CardDescription>
            </CardHeader>
            <CardContent>
              <ItemListEditor
                label={column.title}
                placeholder={column.placeholder}
                items={itemsFor(column.value)}
                onChange={(items) => setColumn(column.value, items)}
                maxItems={10}
                maxLength={300}
                emptyText="Nothing here yet."
              />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
