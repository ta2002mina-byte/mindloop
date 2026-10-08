"use client";

import { Eye, MessageCircleQuestion } from "lucide-react";

import { ItemListEditor } from "@/components/thoughts/item-list-editor";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { DraftListItem, ThoughtDraft } from "@/lib/thoughts/draft";
import type { StepErrors } from "@/lib/thoughts/wizard";

interface StepProps {
  draft: ThoughtDraft;
  update: (patch: Partial<ThoughtDraft>) => void;
  errors: StepErrors;
}

export function StepFactStory({ draft, update, errors }: StepProps) {
  const setFacts = (facts: DraftListItem[]) => update({ facts });
  const setStories = (stories: DraftListItem[]) => update({ stories });

  return (
    <div className="space-y-4">
      {errors.facts ? (
        <p role="alert" className="text-sm text-destructive">
          {errors.facts}
        </p>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="border-emerald-500/30">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Eye className="h-4 w-4 text-emerald-600 dark:text-emerald-400" aria-hidden="true" />
              Fact
            </CardTitle>
            <CardDescription>What do you actually know happened?</CardDescription>
          </CardHeader>
          <CardContent>
            <ItemListEditor
              label="Facts"
              hint="Only things you saw, heard or read. Something another person would agree with."
              placeholder="e.g. The reply was two words long"
              items={draft.facts}
              onChange={setFacts}
              emptyText="No facts yet."
            />
          </CardContent>
        </Card>

        <Card className="border-amber-500/30">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <MessageCircleQuestion className="h-4 w-4 text-amber-600 dark:text-amber-400" aria-hidden="true" />
              Story
            </CardTitle>
            <CardDescription>What are you assuming, predicting, or interpreting?</CardDescription>
          </CardHeader>
          <CardContent>
            <ItemListEditor
              label="Stories"
              hint="The meaning you are adding on top. Stories are normal; naming them is the point."
              placeholder="e.g. It means they are annoyed with me"
              items={draft.stories}
              onChange={setStories}
              emptyText="No stories yet."
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
