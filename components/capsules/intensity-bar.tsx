import { describeIntensity } from "@/lib/constants/thoughts";
import { cn } from "@/lib/utils";

interface IntensityBarProps {
  label: string;
  value: number;
  className?: string;
  barClassName?: string;
}

/** "8 / 10" with a bar under it. Text and number carry the meaning; the bar only illustrates it. */
export function IntensityBar({ label, value, className, barClassName }: IntensityBarProps) {
  return (
    <div className={cn("space-y-1.5", className)}>
      <div className="flex items-baseline justify-between gap-3 text-sm">
        <span className="text-muted-foreground">{label}</span>
        <span className="tabular-nums font-medium">
          {value} / 10<span className="font-normal text-muted-foreground">, {describeIntensity(value).toLowerCase()}</span>
        </span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-muted" role="img" aria-label={`${label}: ${value} out of 10`}>
        <div className={cn("h-full rounded-full bg-primary/80 transition-[width] duration-700", barClassName)} style={{ width: `${value * 10}%` }} />
      </div>
    </div>
  );
}
