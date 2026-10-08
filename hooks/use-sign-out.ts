"use client";

import { useRouter } from "next/navigation";
import { useCallback, useState } from "react";

import { NETWORK_ERROR_MESSAGE } from "@/lib/auth/errors";
import { ROUTES } from "@/lib/constants/routes";
import { createClient } from "@/lib/supabase/client";

export function useSignOut() {
  const router = useRouter();
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const signOut = useCallback(async () => {
    setIsSigningOut(true);
    setError(null);

    try {
      const supabase = createClient();
      const { error: signOutError } = await supabase.auth.signOut();
      if (signOutError) throw signOutError;

      router.replace(ROUTES.login);
      router.refresh();
    } catch (caught) {
      console.error("[auth] Sign out failed:", caught);
      setError(NETWORK_ERROR_MESSAGE);
      setIsSigningOut(false);
    }
  }, [router]);

  return { signOut, isSigningOut, error };
}
