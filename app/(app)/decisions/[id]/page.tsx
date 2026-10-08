import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Info } from "lucide-react";

import { DecisionBoard } from "@/components/decisions/decision-board";
import { DecisionRoomToolbar } from "@/components/decisions/decision-room-toolbar";
import { ROUTES } from "@/lib/constants/routes";
import { getDecisionRoom } from "@/lib/decisions/queries";
import { formatDate } from "@/utils/date";

interface PageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const room = await getDecisionRoom(id);
  return { title: room ? room.title : "Decision not found" };
}

export default async function DecisionRoomDetailPage({ params }: PageProps) {
  const { id } = await params;
  const room = await getDecisionRoom(id);
  if (!room) notFound();

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <Link
          href={ROUTES.decisions}
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          All decisions
        </Link>

        <div className="space-y-2">
          <h1 className="break-anywhere text-2xl font-semibold sm:text-3xl">{room.title}</h1>
          {room.description ? (
            <p className="max-w-2xl break-anywhere text-muted-foreground">{room.description}</p>
          ) : null}
          <p className="text-sm text-muted-foreground">Started {formatDate(room.created_at)}</p>
        </div>
      </div>

      <p className="flex items-start gap-2 rounded-xl border bg-muted/40 px-3.5 py-3 text-sm text-muted-foreground">
        <Info className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
        MindLoop Lab does not rank these options or recommend one. Filling the columns in is what makes the choice
        clearer; the decision stays yours.
      </p>

      <DecisionBoard roomId={room.id} options={room.options} />

      <DecisionRoomToolbar roomId={room.id} title={room.title} />
    </div>
  );
}
