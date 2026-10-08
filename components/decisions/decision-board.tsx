"use client";

import { Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { DecisionOptionCard } from "@/components/decisions/decision-option-card";
import { FormAlert } from "@/components/forms/form-alert";
import { TextField } from "@/components/forms/text-field";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { addDecisionOption } from "@/lib/decisions/actions";
import type { DecisionOptionRow } from "@/types";

const MAX_OPTIONS = 6;

/**
 * The columns of one decision. Each option card saves itself through a Server
 * Action, then this asks the server for fresh data, so the board and the
 * database never drift apart.
 */
export function DecisionBoard({ roomId, options }: { roomId: string; options: DecisionOptionRow[] }) {
  const router = useRouter();
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = () => router.refresh();

  const add = async () => {
    setSaving(true);
    setError(null);

    const result = await addDecisionOption(roomId, { name });
    setSaving(false);

    if (!result.ok) {
      setError(result.message);
      return;
    }
    setName("");
    setAdding(false);
    refresh();
  };

  return (
    <div className="space-y-4">
      {error ? <FormAlert variant="error">{error}</FormAlert> : null}

      {/* One column per option: side by side on a wide screen, stacked on a phone. */}
      <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
        {options.map((option) => (
          <DecisionOptionCard
            key={option.id}
            roomId={roomId}
            option={option}
            canDelete={options.length > 1}
            onChanged={refresh}
          />
        ))}

        {options.length < MAX_OPTIONS ? (
          <Card className="border-dashed">
            <CardContent className="flex h-full min-h-40 flex-col justify-center gap-3 p-5">
              {adding ? (
                <>
                  <TextField
                    label="New option"
                    placeholder="e.g. Defer until January"
                    maxLength={80}
                    value={name}
                    autoFocus
                    onChange={(event) => setName(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter") {
                        event.preventDefault();
                        void add();
                      }
                    }}
                  />
                  <div className="flex gap-2">
                    <Button type="button" size="sm" onClick={() => void add()} loading={saving} disabled={!name.trim()}>
                      Add option
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        setAdding(false);
                        setName("");
                      }}
                      disabled={saving}
                    >
                      Cancel
                    </Button>
                  </div>
                </>
              ) : (
                <Button type="button" variant="ghost" className="h-full" onClick={() => setAdding(true)}>
                  <Plus aria-hidden="true" />
                  Add another option
                </Button>
              )}
            </CardContent>
          </Card>
        ) : null}
      </div>
    </div>
  );
}
