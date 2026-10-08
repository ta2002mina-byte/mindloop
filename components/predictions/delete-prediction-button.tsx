"use client";

import { ConfirmDeleteButton } from "@/components/shared/confirm-delete-button";
import { deletePrediction } from "@/lib/predictions/actions";

export function DeletePredictionButton({ id }: { id: string }) {
  return (
    <ConfirmDeleteButton
      label="Delete this prediction"
      dialogTitle="Delete this prediction?"
      dialogDescription="The prediction and anything you recorded about how it turned out will be removed. This can't be undone."
      onDelete={() => deletePrediction(id)}
    />
  );
}
