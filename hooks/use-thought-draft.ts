"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { createEmptyDraft, type ThoughtDraft } from "@/lib/thoughts/draft";

export type DraftSaveStatus = "idle" | "saving" | "saved" | "unavailable";

const AUTOSAVE_DELAY_MS = 800;

function storageKey(scope: string): string {
  return `mindloop:thought-draft:${scope}`;
}

interface StoredDraft {
  version: 1;
  savedAt: string;
  draft: ThoughtDraft;
}

/**
 * Keeps an in-progress analysis in local storage so a refresh, a closed tab or a
 * back button never loses the work. Nothing here reaches the server: the draft is
 * only sent when the user presses "Save Thought".
 *
 * @param scope   "new" for a fresh analysis, or the thought id when editing.
 * @param initial The starting draft (an empty one, or one built from a saved thought).
 */
export function useThoughtDraft(scope: string, initial: ThoughtDraft) {
  const [draft, setDraft] = useState<ThoughtDraft>(initial);
  const [status, setStatus] = useState<DraftSaveStatus>("idle");
  const [restoredAt, setRestoredAt] = useState<string | null>(null);
  // Local storage is read after mount, so the server and client render the same markup.
  const [hydrated, setHydrated] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const key = storageKey(scope);

  useEffect(() => {
    let stored: string | null = null;
    try {
      stored = window.localStorage.getItem(key);
    } catch {
      setStatus("unavailable");
      setHydrated(true);
      return;
    }

    if (stored) {
      try {
        const parsed = JSON.parse(stored) as StoredDraft;
        if (parsed?.version === 1 && parsed.draft) {
          setDraft({ ...createEmptyDraft(), ...parsed.draft });
          setRestoredAt(parsed.savedAt);
        }
      } catch {
        // A corrupted draft is not worth surfacing; start from the initial one.
        try {
          window.localStorage.removeItem(key);
        } catch {
          /* ignore */
        }
      }
    }
    setHydrated(true);
  }, [key]);

  const write = useCallback(
    (value: ThoughtDraft) => {
      try {
        const payload: StoredDraft = { version: 1, savedAt: new Date().toISOString(), draft: value };
        window.localStorage.setItem(key, JSON.stringify(payload));
        setStatus("saved");
      } catch {
        setStatus("unavailable");
      }
    },
    [key],
  );

  // Debounced autosave: typing does not hit local storage on every keystroke.
  useEffect(() => {
    if (!hydrated || status === "unavailable") return;

    setStatus("saving");
    timer.current = setTimeout(() => write(draft), AUTOSAVE_DELAY_MS);

    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
    // `status` is intentionally not a dependency: it is set by this effect.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draft, hydrated, write]);

  const saveNow = useCallback(() => {
    if (timer.current) clearTimeout(timer.current);
    write(draft);
  }, [draft, write]);

  const clear = useCallback(() => {
    if (timer.current) clearTimeout(timer.current);
    try {
      window.localStorage.removeItem(key);
    } catch {
      /* ignore */
    }
    setStatus("idle");
    setRestoredAt(null);
  }, [key]);

  const discardRestored = useCallback(() => {
    if (timer.current) clearTimeout(timer.current);
    setDraft(initial);
    setRestoredAt(null);
    write(initial);
  }, [initial, write]);

  return { draft, setDraft, hydrated, status, restoredAt, saveNow, clear, discardRestored };
}
