import { Lock } from "lucide-react";
import Link from "next/link";

import { CapsuleComparison } from "@/components/capsules/capsule-comparison";
import { DeleteCapsuleButton } from "@/components/capsules/delete-capsule-button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { thoughtRoute } from "@/lib/constants/routes";
import type { CapsuleView } from "@/types";
import { describeDaysUntil, formatDate, formatDateOnly } from "@/utils/date";

/**
 * A sealed capsule. It deliberately shows only the title and the date: the
 * original text and intensity were never sent to the browser.
 */
export function LockedCapsuleCard({ capsule }: { capsule: CapsuleView }) {
  return (
    <Card className="bg-muted/20">
      <CardContent className="space-y-4 p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 items-start gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent text-accent-foreground">
              <Lock className="h-4 w-4" aria-hidden="true" />
            </span>
            <div className="min-w-0 space-y-1">
              <p className="break-anywhere font-medium leading-snug">{capsule.thoughtTitle}</p>
              <p className="text-sm text-muted-foreground">Sealed {formatDate(capsule.createdAt)}</p>
            </div>
          </div>
          <DeleteCapsuleButton id={capsule.id} />
        </div>

        <Badge variant="outline">
          Opens {describeDaysUntil(capsule.reopenDate)}, {formatDateOnly(capsule.reopenDate)}
        </Badge>
        <p className="text-xs text-muted-foreground">What you wrote and how strong it felt stay hidden until then.</p>
      </CardContent>
    </Card>
  );
}

export function ReopenedCapsuleCard({ capsule }: { capsule: CapsuleView }) {
  return (
    <Card>
      <CardContent className="space-y-4 p-5">
        <div className="flex items-start justify-between gap-3">
          <p className="text-sm text-muted-foreground">
            About{" "}
            <Link href={thoughtRoute(capsule.thoughtId)} className="break-anywhere text-primary underline-offset-4 hover:underline">
              {capsule.thoughtTitle}
            </Link>
          </p>
          <DeleteCapsuleButton id={capsule.id} />
        </div>
        <CapsuleComparison capsule={capsule} />
      </CardContent>
    </Card>
  );
}
