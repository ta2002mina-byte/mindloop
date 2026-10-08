"use client";

import { useTheme } from "next-themes";
import { useState, useTransition } from "react";

import { FormAlert } from "@/components/forms/form-alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { updateNotificationPreference } from "@/lib/settings/actions";

const THEME_OPTIONS = [
  { value: "light", label: "Light" },
  { value: "dark", label: "Dark" },
  { value: "system", label: "System" },
] as const;

interface PreferencesSectionProps {
  initialNotificationsEnabled: boolean;
}

export function PreferencesSection({ initialNotificationsEnabled }: PreferencesSectionProps) {
  const { theme, setTheme } = useTheme();
  const [notificationsEnabled, setNotificationsEnabled] = useState(initialNotificationsEnabled);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const toggleNotifications = () => {
    const next = !notificationsEnabled;
    setNotificationsEnabled(next); // optimistic; reverted below if the save fails
    setError(null);

    startTransition(async () => {
      const result = await updateNotificationPreference(next);
      if (!result.ok) {
        setNotificationsEnabled(!next);
        setError(result.message);
      }
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Preferences</CardTitle>
        <CardDescription>Choose how MindLoop Lab looks and reaches you.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {error ? <FormAlert variant="error">{error}</FormAlert> : null}

        <div>
          <p className="text-sm font-medium">Theme</p>
          <p className="mt-1 text-sm text-muted-foreground">Pick a look, or match your system.</p>
          <div className="mt-3 inline-flex rounded-full border bg-muted/50 p-1" role="radiogroup" aria-label="Theme">
            {THEME_OPTIONS.map((option) => (
              <button
                key={option.value}
                type="button"
                role="radio"
                aria-checked={theme === option.value}
                onClick={() => setTheme(option.value)}
                className={`rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                  theme === option.value
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-start justify-between gap-4 border-t pt-5">
          <div>
            <p className="text-sm font-medium">Email notifications</p>
            <p className="mt-1 max-w-sm text-sm text-muted-foreground">
              Occasional reminders about worry capsules ready to reopen and predictions ready to review.
            </p>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            role="switch"
            aria-checked={notificationsEnabled}
            loading={isPending}
            onClick={toggleNotifications}
          >
            {notificationsEnabled ? "On" : "Off"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
