import { TRAFFIC_LIGHT_MAP } from "@/lib/constants/thoughts";
import { cn } from "@/lib/utils";
import type { TrafficLight } from "@/types";

interface TrafficLightBadgeProps {
  value: TrafficLight;
  /** "dot" for inline lists, "pill" for cards and headers. */
  variant?: "dot" | "pill";
  className?: string;
}

/** Colour is never the only signal: every state also carries a text label. */
export function TrafficLightBadge({ value, variant = "dot", className }: TrafficLightBadgeProps) {
  const meta = TRAFFIC_LIGHT_MAP[value];

  if (variant === "pill") {
    return (
      <span
        className={cn(
          "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium",
          meta.border,
          meta.tint,
          meta.text,
          className,
        )}
      >
        <span aria-hidden="true" className={cn("h-2 w-2 rounded-full", meta.dot)} />
        {meta.label}
      </span>
    );
  }

  return (
    <span className={cn("inline-flex items-center gap-1.5 text-xs font-medium", meta.text, className)}>
      <span aria-hidden="true" className={cn("h-2 w-2 rounded-full", meta.dot)} />
      {meta.label}
    </span>
  );
}
