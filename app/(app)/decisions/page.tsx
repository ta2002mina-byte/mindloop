import type { Metadata } from "next";
import { Scale } from "lucide-react";

import { DecisionRoomCards } from "@/components/decisions/decision-room-cards";
import { NewDecisionForm } from "@/components/decisions/new-decision-form";
import { PageHeader } from "@/components/layout/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { listDecisionRooms } from "@/lib/decisions/queries";

export const metadata: Metadata = { title: "Decision Room" };

export default async function DecisionRoomPage() {
  const rooms = await listDecisionRooms();

  return (
    <>
      <PageHeader
        title="Decision Room"
        description="Lay your options side by side. The board organises the choice; it never makes it for you."
        actions={rooms.length > 0 ? <NewDecisionForm /> : undefined}
      />

      {rooms.length === 0 ? (
        <div className="space-y-4">
          <EmptyState
            icon={Scale}
            title="No decisions on the table"
            description="Start with the choice you keep going round on. Each option gets its own column: benefits, concerns, what you know, what you don't, what you can control, and one first step."
          />
          <NewDecisionForm defaultOpen />
        </div>
      ) : (
        <DecisionRoomCards rooms={rooms} />
      )}
    </>
  );
}
