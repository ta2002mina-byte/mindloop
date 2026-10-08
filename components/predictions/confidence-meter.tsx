import { describeConfidence } from "@/lib/constants/phase3";
import { cn } from "@/lib/utils";

interface ConfidenceMeterProps {
  confidence: number;
  className?: string;
}

/** A single horizontal bar for "how sure were you", with the number written out. */
export function ConfidenceMeter({ confidence, className }: ConfidenceMeterProps) {
  return (
    <div className={cn("space-y-1.5", className)}>
      <div className="flex items-baseline justify-between gap-3 text-sm">
        <span className="text-muted-foreground">Confidence</span>
        <span className="tabular-nums font-medium">
          {confidence}%<span className="font-normal text-muted-foreground">, {describeConfidence(confidence).toLowerCase()}</span>
        </span>
      </div>
      <div
        className="h-2 overflow-hidden rounded-full bg-muted"
        role="img"
        aria-label={`Confidence ${confidence} percent`}
      >
        <div className="h-full rounded-full bg-primary transition-[width] duration-700" style={{ width: `${Math.max(confidence, 2)}%` }} />
      </div>
    </div>
  );
}
