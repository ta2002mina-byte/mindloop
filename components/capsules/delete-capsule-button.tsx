"use client";

import { ConfirmDeleteButton } from "@/components/shared/confirm-delete-button";
import { deleteCapsule } from "@/lib/capsules/actions";

export function DeleteCapsuleButton({ id }: { id: string }) {
  return (
    <ConfirmDeleteButton
      label="Delete this capsule"
      dialogTitle="Delete this capsule?"
      dialogDescription="The capsule and anything you recorded when you opened it will be removed. The thought itself stays. This can't be undone."
      onDelete={() => deleteCapsule(id)}
    />
  );
}
