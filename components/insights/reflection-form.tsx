"use client";

import { Check, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { FormAlert } from "@/components/forms/form-alert";
import { TextareaField } from "@/components/forms/textarea-field";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { Button } from "@/components/ui/button";
import { deleteReflection, saveReflection } from "@/lib/insights/actions";
import type { ReflectionRow } from "@/types";
import { formatDateOnly } from "@/utils/date";

interface ReflectionFormProps {
  weekStart: string;
  existing: ReflectionRow | null;
}

export function ReflectionForm({ weekStart, existing }: ReflectionFormProps) {
  const router = useRouter();
  const [content, setContent] = useState(existing?.content ?? "");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const submit = async () => {
    setSaving(true);
    setError(null);
    setSaved(false);

    const result = await saveReflection({ weekStart, content });
    setSaving(false);

    if (!result.ok) {
      setError(result.message);
      return;
    }
    setSaved(true);
    router.refresh();
  };

  const remove = async () => {
    if (!existing) return;
    setDeleting(true);
    setError(null);

    const result = await deleteReflection(existing.id);
    setDeleting(false);
    setConfirmDelete(false);

    if (!result.ok) {
      setError(result.message);
      return;
    }
    setContent("");
    setSaved(false);
    router.refresh();
  };

  return (
    <div className="max-w-2xl space-y-4">
      {error ? <FormAlert variant="error">{error}</FormAlert> : null}
      {saved ? <FormAlert variant="success">Saved. You can come back and edit it any time this week.</FormAlert> : null}

      <TextareaField
        label="What did you learn about your thinking this week?"
        placeholder="Anything you noticed. A pattern, a prediction that did not land, a step that helped."
        className="min-h-32"
        maxLength={2000}
        maxChars={2000}
        currentChars={content.length}
        value={content}
        hint={`For the week beginning ${formatDateOnly(weekStart)}. Only you ever see this.`}
        onChange={(event) => {
          setContent(event.target.value);
          setSaved(false);
        }}
      />

      <div className="flex flex-wrap gap-2">
        <Button type="button" onClick={() => void submit()} loading={saving} disabled={content.trim().length < 3}>
          <Check aria-hidden="true" />
          {existing ? "Update reflection" : "Save reflection"}
        </Button>
        {existing ? (
          <Button
            type="button"
            variant="ghost"
            className="text-destructive hover:bg-destructive/10 hover:text-destructive"
            onClick={() => setConfirmDelete(true)}
            disabled={deleting}
          >
            <Trash2 aria-hidden="true" />
            Delete
          </Button>
        ) : null}
      </div>

      <ConfirmDialog
        open={confirmDelete}
        onOpenChange={setConfirmDelete}
        title="Delete this week's reflection?"
        description="The text is removed for good. Your thoughts, predictions and capsules are not affected."
        confirmLabel="Delete reflection"
        loading={deleting}
        onConfirm={() => void remove()}
      />
    </div>
  );
}
