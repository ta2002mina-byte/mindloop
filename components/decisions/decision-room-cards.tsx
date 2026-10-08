import Link from "next/link";
import { Columns3, Footprints } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { decisionRoute } from "@/lib/constants/routes";
import type { DecisionRoomListItem } from "@/types";
import { formatRelativeDate } from "@/utils/date";

export function DecisionRoomCards({ rooms }: { rooms: DecisionRoomListItem[] }) {
  return (
    <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {rooms.map((room) => (
        <li key={room.id}>
          <Card className="group relative h-full transition-colors focus-within:border-primary/60 hover:border-primary/40">
            <CardContent className="flex h-full flex-col gap-3 p-5">
              <h3 className="break-anywhere font-semibold leading-snug">
                {/* The whole card is clickable through this stretched link. */}
                <Link
                  href={decisionRoute(room.id)}
                  className="rounded-sm outline-none after:absolute after:inset-0 after:rounded-2xl focus-visible:underline"
                >
                  {room.title}
                </Link>
              </h3>

              {room.description ? (
                <p className="line-clamp-2 break-anywhere text-sm text-muted-foreground">{room.description}</p>
              ) : null}

              {room.optionNames.length ? (
                <p className="break-anywhere text-sm text-muted-foreground">{room.optionNames.join(" · ")}</p>
              ) : null}

              <div className="mt-auto flex flex-wrap items-center gap-2 border-t pt-3">
                <Badge variant="outline">
                  <Columns3 className="h-3 w-3" aria-hidden="true" />
                  {room.optionCount} {room.optionCount === 1 ? "option" : "options"}
                </Badge>
                <Badge variant={room.firstStepCount > 0 ? "success" : "muted"}>
                  <Footprints className="h-3 w-3" aria-hidden="true" />
                  {room.firstStepCount} with a first step
                </Badge>
                <span className="ml-auto text-xs text-muted-foreground">{formatRelativeDate(room.updated_at)}</span>
              </div>
            </CardContent>
          </Card>
        </li>
      ))}
    </ul>
  );
}
