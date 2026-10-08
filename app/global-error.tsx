"use client";

import { useEffect } from "react";

import "./globals.css";

// This only renders if the root layout itself throws, so unlike app/(app)/error.tsx
// it must supply its own <html>/<body> and can't assume providers ran.
export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error("[root] Unhandled error:", error);
  }, [error]);

  return (
    <html lang="en">
      <body className="flex min-h-dvh flex-col items-center justify-center gap-6 bg-[#F5F6FA] px-6 text-center text-[#171826]">
        <div className="space-y-2">
          <h1 className="text-2xl font-semibold">Something went wrong</h1>
          <p className="mx-auto max-w-sm text-sm text-[#5A5D73]">
            MindLoop Lab hit an unexpected error. Your data is safe. Try again, and if it keeps happening, refresh the
            page.
          </p>
        </div>
        <button
          type="button"
          onClick={reset}
          className="rounded-full bg-[#4F46E5] px-5 py-2.5 text-sm font-medium text-white"
        >
          Try again
        </button>
      </body>
    </html>
  );
}
