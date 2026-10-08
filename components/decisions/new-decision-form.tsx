"use client";

import { Plus, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { FormAlert } from "@/components/forms/form-alert";
import { TextField } from "@/components/forms/text-field";
import { TextareaField } from "@/components/forms/textarea-field";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { decisionRoute } from "@/lib/constants/routes";
import { createDecisionRoom } from "@/lib/decisions/actions";

/** Opens into a small form, then sends the user straight to the new board. */
export function NewDecisionForm({ defaultOpen = false }: { defaultOpen?: boolean }) {
  const router = useRouter();
  const [open, setOpen] = useState(defaultOpen);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    setSaving(true);
    setError(null);

    const result = await createDecisionRoom({ title, description });

    if (!result.ok) {
      setSaving(false);
      setError(result.message);
      return;
    }
    // Keep the button busy until the new page takes over.
    router.push(decisionRoute(result.data.id));
  };

  if (!open) {
    return (
      <Button type="button" onClick={() => setOpen(true)}>
        <Plus aria-hidden="true" />
        New decision
      </Button>
    );
  }

  return (
    <Card>
      <CardContent className="space-y-4 p-5">
        {error ? <FormAlert variant="error">{error}</FormAlert> : null}

        <TextField
          label="The decision"
          placeholder="e.g. Should I take this course?"
          maxLength={160}
          value={title}
          autoFocus
          hint="Phrase it as the question you keep going round on."
          onChange={(event) => setTitle(event.target.value)}
        />

        <TextareaField
          label="Any context (optional)"
          placeholder="What makes this hard to decide right now?"
          maxLength={1000}
          maxChars={1000}
          currentChars={description.length}
          value={description}
          onChange={(event) => setDescription(event.target.value)}
        />

        <div className="flex flex-wrap gap-2">
          <Button type="button" onClick={() => void submit()} loading={saving} disabled={!title.trim()}>
            Create board
          </Button>
          <Button type="button" variant="ghost" onClick={() => setOpen(false)} disabled={saving}>
            <X aria-hidden="true" />
            Cancel
          </Button>
        </div>

        <p className="text-xs text-muted-foreground">
          The board starts with Option A, Option B and Wait. Rename, add or remove them as you like.
        </p>
      </CardContent>
    </Card>
  );
}
