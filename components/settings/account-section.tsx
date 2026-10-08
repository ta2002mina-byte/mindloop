"use client";

import { useId, useState } from "react";

import { FormAlert } from "@/components/forms/form-alert";
import { LogoutButton } from "@/components/layout/logout-button";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { deleteAccount } from "@/lib/settings/actions";

const CONFIRM_WORD = "DELETE";

export function AccountSection() {
  const [open, setOpen] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const confirmId = useId();

  const canDelete = confirmText === CONFIRM_WORD && !isDeleting;

  const handleDelete = async () => {
    setIsDeleting(true);
    setError(null);

    const result = await deleteAccount();
    // deleteAccount redirects to /login on success, so reaching here means it failed.
    if (result && !result.ok) {
      setError(result.message);
    }
    setIsDeleting(false);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Account</CardTitle>
        <CardDescription>Session and account management.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-medium">Log out</p>
            <p className="mt-1 text-sm text-muted-foreground">End your session on this device.</p>
          </div>
          <LogoutButton />
        </div>

        <div className="flex items-center justify-between gap-4 border-t pt-5">
          <div>
            <p className="text-sm font-medium text-destructive">Delete account</p>
            <p className="mt-1 max-w-sm text-sm text-muted-foreground">
                 Permanently deletes your profile and everything you&apos;ve saved. This cannot be undone.
            </p>
          </div>

          <Dialog
            open={open}
            onOpenChange={(next) => {
              setOpen(next);
              if (!next) {
                setConfirmText("");
                setError(null);
              }
            }}
          >
            <DialogTrigger asChild>
              <Button type="button" variant="destructive" size="sm">
                Delete account
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Delete your account?</DialogTitle>
                <DialogDescription>
                  This permanently removes your profile, thoughts, predictions, worry capsules, decisions and
                  insights. There is no way to undo this.
                </DialogDescription>
              </DialogHeader>

              {error ? <FormAlert variant="error">{error}</FormAlert> : null}

              <div className="space-y-2">
                <Label htmlFor={confirmId}>
                  Type <span className="font-semibold">{CONFIRM_WORD}</span> to confirm
                </Label>
                <Input
                  id={confirmId}
                  value={confirmText}
                  onChange={(event) => setConfirmText(event.target.value)}
                  autoComplete="off"
                  aria-describedby={`${confirmId}-hint`}
                />
                <p id={`${confirmId}-hint`} className="text-xs text-muted-foreground">
                  This step exists so a stray click can&apos;t delete your account.
                </p>
              </div>

              <DialogFooter>
                <Button type="button" variant="ghost" onClick={() => setOpen(false)} disabled={isDeleting}>
                  Cancel
                </Button>
                <Button type="button" variant="destructive" disabled={!canDelete} loading={isDeleting} onClick={handleDelete}>
                  {isDeleting ? "Deleting…" : "Delete my account"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </CardContent>
    </Card>
  );
}
