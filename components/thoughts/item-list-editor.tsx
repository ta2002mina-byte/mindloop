"use client";

import { Plus, X } from "lucide-react";
import { useId, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { draftItemId, type DraftListItem } from "@/lib/thoughts/draft";
import { cn } from "@/lib/utils";

interface ItemListEditorProps {
  label: string;
  hint?: string;
  placeholder: string;
  items: DraftListItem[];
  onChange: (items: DraftListItem[]) => void;
  maxItems?: number;
  maxLength?: number;
  className?: string;
  /** Rendered instead of the list when it is empty. */
  emptyText?: string;
}

/**
 * One text input plus an "Add" button, and a removable row per saved item.
 * Adding on Enter keeps it fast to type several items in a row.
 */
export function ItemListEditor({
  label,
  hint,
  placeholder,
  items,
  onChange,
  maxItems = 20,
  maxLength = 500,
  className,
  emptyText,
}: ItemListEditorProps) {
  const [value, setValue] = useState("");
  const [touchedTooShort, setTouchedTooShort] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const fieldId = useId();
  const errorId = `${fieldId}-error`;
  const atLimit = items.length >= maxItems;

  const add = () => {
    const content = value.trim();
    if (content.length < 3) {
      setTouchedTooShort(content.length > 0);
      return;
    }
    if (atLimit) return;

    onChange([...items, { id: draftItemId(), content }]);
    setValue("");
    setTouchedTooShort(false);
    inputRef.current?.focus();
  };

  const remove = (id: string) => onChange(items.filter((item) => item.id !== id));

  return (
    <div className={cn("space-y-3", className)}>
      <div className="space-y-1">
        <Label htmlFor={fieldId}>{label}</Label>
        {hint ? <p className="text-sm text-muted-foreground">{hint}</p> : null}
      </div>

      <div className="flex gap-2">
        <Input
          ref={inputRef}
          id={fieldId}
          value={value}
          placeholder={placeholder}
          maxLength={maxLength}
          disabled={atLimit}
          aria-invalid={touchedTooShort ? true : undefined}
          aria-describedby={touchedTooShort ? errorId : undefined}
          onChange={(event) => {
            setValue(event.target.value);
            setTouchedTooShort(false);
          }}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              add();
            }
          }}
        />
        <Button type="button" variant="outline" size="icon" onClick={add} disabled={atLimit} className="shrink-0">
          <Plus aria-hidden="true" />
          <span className="sr-only">Add to {label}</span>
        </Button>
      </div>

      {touchedTooShort ? (
        <p id={errorId} className="text-sm text-destructive">
          Write at least a few words.
        </p>
      ) : null}
      {atLimit ? <p className="text-sm text-muted-foreground">That is the maximum of {maxItems} items.</p> : null}

      {items.length > 0 ? (
        <ul className="space-y-2">
          {items.map((item) => (
            <li
              key={item.id}
              className="flex items-start justify-between gap-2 rounded-xl border bg-muted/30 px-3 py-2 text-sm"
            >
              <span className="break-anywhere py-0.5">{item.content}</span>
              <button
                type="button"
                onClick={() => remove(item.id)}
                className="shrink-0 rounded-lg p-1 text-muted-foreground transition-colors hover:bg-background hover:text-destructive focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <X className="h-4 w-4" aria-hidden="true" />
                <span className="sr-only">Remove &ldquo;{item.content}&rdquo;</span>
              </button>
            </li>
          ))}
        </ul>
      ) : emptyText ? (
        <p className="rounded-xl border border-dashed px-3 py-4 text-center text-sm text-muted-foreground">
          {emptyText}
        </p>
      ) : null}
    </div>
  );
}
