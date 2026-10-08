"use client";

import { AlertCircle } from "lucide-react";
import { useEffect } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function AppError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error("[app] Unhandled error:", error);
  }, [error]);

  return (
    <Card role="alert">
      <CardContent className="flex flex-col items-center gap-4 px-6 py-14 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-destructive/10 text-destructive">
          <AlertCircle className="h-6 w-6" aria-hidden="true" />
        </div>
        <div className="space-y-2">
          <h1 className="text-xl font-semibold">This page didn&apos;t load</h1>
          <p className="mx-auto max-w-md text-muted-foreground">
            Something went wrong on our side. Your data is safe. Try again, and if it keeps happening, refresh the page.
          </p>
        </div>
        <Button onClick={reset}>Try again</Button>
      </CardContent>
    </Card>
  );
}
