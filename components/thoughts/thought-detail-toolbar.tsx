"use client";

import { Archive, ArchiveRestore, CircleCheck, Pencil, RotateCcw, Trash2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { FormAlert } from "@/components/forms/form-alert";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { Button, buttonVariants } from "@/components/ui/button";
import { ROUTES, thoughtEditRoute } from "@/lib/constants/routes";
import { deleteThought, setThoughtStatus } from "@/lib/thoughts/actions";
import { cn } from "@/lib/utils";
import type { ThoughtStatus } from "@/types";

interface ThoughtDetailToolbarProps {
  thoughtId: string;
  status: ThoughtStatus;
}

export function ThoughtDetailToolbar({ thoughtId, status }: ThoughtDetailToolbarProps) {
  const router = useRouter();
  const [pending, setPending] = useState<"status" | "delete" | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [confirmArchive, setConfirmArchive] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const changeStatus = async (next: ThoughtStatus) => {
    setPending("status");
    setError(null);
    const result = await setThoughtStatus(thoughtId, next);
    setPending(null);
    setConfirmArchive(false);

    if (!result.ok) {
      setError(result.message);
      return;
    }
    router.refresh();
  };

  const remove = async () => {
    setPending("delete");
    setError(null);
    const result = await deleteThought(thoughtId);

    if (!result.ok) {
      setPending(null);
      setConfirmDelete(false);
      setError(result.message);
      return;
    }
    // Leave the page before clearing state: the row is gone.
    router.replace(ROUTES.thoughts);
  };

  const isBusy = pending !== null;

  return (
    <div className="space-y-3">
      {error ? <FormAlert variant="error">{error}</FormAlert> : null}
      <div className="flex flex-wrap items-center gap-2">
      <Link
        href={thoughtEditRoute(thoughtId)}
        className={cn(buttonVariants({ variant: "outline", size: "sm" }), isBusy && "pointer-events-none opacity-50")}
      >
        <Pencil aria-hidden="true" />
        Edit
      </Link>

      {status === "resolved" ? (
        <Button variant="outline" size="sm" disabled={isBusy} onClick={() => changeStatus("active")}>
          <RotateCcw aria-hidden="true" />
          Reopen
        </Button>
      ) : (
        <Button variant="outline" size="sm" disabled={isBusy} onClick={() => changeStatus("resolved")}>
          <CircleCheck aria-hidden="true" />
          Mark resolved
        </Button>
      )}

      {status === "archived" ? (
        <Button variant="outline" size="sm" disabled={isBusy} onClick={() => changeStatus("active")}>
          <ArchiveRestore aria-hidden="true" />
          Unarchive
        </Button>
      ) : (
        <Button variant="outline" size="sm" disabled={isBusy} onClick={() => setConfirmArchive(true)}>
          <Archive aria-hidden="true" />
          Archive
        </Button>
      )}

      <Button
        variant="ghost"
        size="sm"
        disabled={isBusy}
        className="text-destructive hover:bg-destructive/10 hover:text-destructive"
        onClick={() => setConfirmDelete(true)}
      >
        <Trash2 aria-hidden="true" />
        Delete
      </Button>

      <ConfirmDialog
        open={confirmArchive}
        onOpenChange={setConfirmArchive}
        title="Archive this thought?"
        description="It leaves your active list but stays searchable under the Archived filter. You can bring it back any time."
        confirmLabel="Archive"
        confirmVariant="default"
        loading={pending === "status"}
        onConfirm={() => void changeStatus("archived")}
      />

      <ConfirmDialog
        open={confirmDelete}
        onOpenChange={setConfirmDelete}
        title="Delete this thought?"
        description="This removes the thought and everything attached to it: facts, stories, feelings, the control map and its action. It can't be undone."
        confirmLabel="Delete for good"
        loading={pending === "delete"}
        onConfirm={() => void remove()}
      />
      </div>
    </div>
  );
}
