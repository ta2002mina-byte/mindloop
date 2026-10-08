import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ROUTES } from "@/lib/constants/routes";

export function WelcomeCard({ firstName }: { firstName: string }) {
  return (
    <Card
      className="relative h-full overflow-hidden border-0 text-white shadow-md"
      style={{
        backgroundColor: "hsl(232 38% 9%)",
        backgroundImage:
          "radial-gradient(70% 90% at 0% 0%, hsl(243 80% 48% / 0.65), transparent 70%), radial-gradient(45% 70% at 100% 100%, hsl(165 70% 40% / 0.35), transparent 70%)",
      }}
    >
      <div className="relative flex h-full flex-col justify-between gap-8 p-6 sm:p-8">
        <div className="max-w-lg space-y-2">
          <h2 className="text-2xl font-semibold sm:text-3xl">{firstName ? `Welcome back, ${firstName}.` : "Welcome back."}</h2>
          <p className="text-white/70">See the loop. Understand the pattern. Take the next step.</p>
        </div>
        <div>
          <Button asChild variant="secondary" className="bg-white text-slate-900 hover:bg-white/90">
            <Link href={ROUTES.thoughts}>
              Open Thought Lab
              <ArrowRight aria-hidden="true" />
            </Link>
          </Button>
        </div>
      </div>
    </Card>
  );
}
