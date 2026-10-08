import Link from "next/link";

import { thoughtRoute } from "@/lib/constants/routes";
import type { RelatedThought } from "@/lib/pattern-detector";

/** Native <details>: keyboard and screen-reader friendly with no JavaScript. */
export function RelatedThoughts({ thoughts, total }: { thoughts: RelatedThought[]; total: number }) {
  if (thoughts.length === 0) return null;

  return (
    <details className="group rounded-xl border bg-muted/20 px-3.5 py-2.5 text-sm">
      <summary className="cursor-pointer list-none font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring [&::-webkit-details-marker]:hidden">
        <span className="inline-flex items-center gap-2">
          <span aria-hidden="true" className="text-muted-foreground transition-transform group-open:rotate-90">
            ›
          </span>
          Related thoughts ({total})
        </span>
      </summary>
      <ul className="mt-2.5 space-y-1.5 border-t pt-2.5">
        {thoughts.map((thought) => (
          <li key={thought.id}>
            <Link href={thoughtRoute(thought.id)} className="break-anywhere text-primary underline-offset-4 hover:underline">
              {thought.title}
            </Link>
          </li>
        ))}
        {total > thoughts.length ? (
          <li className="text-xs text-muted-foreground">Showing the {thoughts.length} most recent.</li>
        ) : null}
      </ul>
    </details>
  );
}
