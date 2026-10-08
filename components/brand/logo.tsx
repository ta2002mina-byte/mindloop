import { cn } from "@/lib/utils";

/** An open loop with a single node: the thought that keeps coming back around. */
export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" fill="none" aria-hidden="true" className={cn("h-8 w-8 text-primary", className)}>
      <path d="M23.66 9.57A10 10 0 1 1 12.58 6.6" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" />
      <circle cx="12.58" cy="6.6" r="2.8" className="fill-signal" />
    </svg>
  );
}

interface LogoProps {
  className?: string;
  showWordmark?: boolean;
  /** Use on always-dark surfaces (e.g. the auth brand panel). */
  onDark?: boolean;
}

export function Logo({ className, showWordmark = true, onDark = false }: LogoProps) {
  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <LogoMark className={onDark ? "text-white" : undefined} />
      {showWordmark ? (
        <span className={cn("font-display text-xl font-semibold tracking-tight", onDark && "text-white")}>
          MindLoop
          <span className={cn("ml-1 font-normal", onDark ? "text-white/60" : "text-muted-foreground")}>Lab</span>
        </span>
      ) : (
        <span className="sr-only">MindLoop Lab</span>
      )}
    </span>
  );
}
