"use client";

import { Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { Button } from "@/components/ui/button";
import type { ActionResult } from "@/types";

interface ConfirmDeleteButtonProps {
  /** Screen-reader name for the icon button, for example "Delete this prediction". */
  label: string;
  dialogTitle: string;
  dialogDescription: string;
  onDelete: () => Promise<ActionResult>;
}

/** A small icon button that asks before it deletes, then refreshes the page. */
export function ConfirmDeleteButton({ label, dialogTitle, dialogDescription, onDelete }: ConfirmDeleteButtonProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const confirm = async () => {
    setLoading(true);
    setError(null);
    const result = await onDelete();
    setLoading(false);

    if (!result.ok) {
      setError(result.message);
      return;
    }
    setOpen(false);
    router.refresh();
  };

  return (
    <>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="h-8 w-8 text-muted-foreground hover:text-destructive"
        onClick={() => {
          setError(null);
          setOpen(true);
        }}
      >
        <Trash2 aria-hidden="true" />
        <span className="sr-only">{label}</span>
      </Button>
      <ConfirmDialog
        open={open}
        onOpenChange={(next) => {
          if (!loading) setOpen(next);
        }}
        title={dialogTitle}
        description={error ? `${dialogDescription} (${error})` : dialogDescription}
        confirmLabel="Delete"
        loading={loading}
        onConfirm={() => void confirm()}
      />
    </>
  );
}
