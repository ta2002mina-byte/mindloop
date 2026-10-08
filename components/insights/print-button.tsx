"use client";

import { Printer } from "lucide-react";

import { Button } from "@/components/ui/button";

/** Opens the browser's own print dialog, which is also where "Save as PDF" lives. */
export function PrintButton() {
  return (
    <Button type="button" variant="outline" size="sm" onClick={() => window.print()}>
      <Printer aria-hidden="true" />
      Print or save as PDF
    </Button>
  );
}
