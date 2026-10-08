"use client";

import { Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { FormAlert } from "@/components/forms/form-alert";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { Button } from "@/components/ui/button";
import { ROUTES } from "@/lib/constants/routes";
import { deleteDecisionRoom } from "@/lib/decisions/actions";

export function DecisionRoomToolbar({ roomId, title }: { roomId: string; title: string }) {
  const router = useRouter();
  const [confirm, setConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const remove = async () => {
    setDeleting(true);
    setError(null);

    const result = await deleteDecisionRoom(roomId);
    if (!result.ok) {
      setDeleting(false);
      setConfirm(false);
      setError(result.message);
      return;
    }
    router.replace(ROUTES.decisions);
  };

  return (
    <div className="space-y-3">
      {error ? <FormAlert variant="error">{error}</FormAlert> : null}
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="text-destructive hover:bg-destructive/10 hover:text-destructive"
        onClick={() => setConfirm(true)}
        disabled={deleting}
      >
        <Trash2 aria-hidden="true" />
        Delete board
      </Button>

      <ConfirmDialog
        open={confirm}
        onOpenChange={setConfirm}
        title={`Delete “${title}”?`}
        description="Every option and everything written in them goes with it. This can't be undone."
        confirmLabel="Delete for good"
        loading={deleting}
        onConfirm={() => void remove()}
      />
    </div>
  );
}
