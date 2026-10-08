"use client";

import { LogOut } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useSignOut } from "@/hooks/use-sign-out";

export function LogoutButton() {
  const { signOut, isSigningOut, error } = useSignOut();

  return (
    <div className="flex items-center gap-2">
      {error ? (
        <p role="alert" className="hidden max-w-[14rem] text-xs text-destructive md:block">
          {error}
        </p>
      ) : null}
      <Button type="button" variant="ghost" size="sm" onClick={signOut} loading={isSigningOut} className="px-2.5 sm:px-3">
        {!isSigningOut ? <LogOut aria-hidden="true" /> : null}
        <span className="sr-only sm:not-sr-only">{isSigningOut ? "Logging out…" : "Log out"}</span>
      </Button>
    </div>
  );
}
