import Link from "next/link";

import { Logo } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";
import { ROUTES } from "@/lib/constants/routes";

export default function NotFound() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-6 px-6 text-center">
      <Logo />
      <div className="space-y-2">
        <h1 className="text-3xl font-semibold">This page isn&apos;t part of the loop</h1>
        <p className="mx-auto max-w-sm text-muted-foreground">
          The link may be old or mistyped. Head back to your dashboard to pick up where you left off.
        </p>
      </div>
      <Button asChild>
        <Link href={ROUTES.dashboard}>Go to dashboard</Link>
      </Button>
    </main>
  );
}
