import type { Metadata } from "next";

import { PageHeader } from "@/components/layout/page-header";
import { ThoughtWizard } from "@/components/thoughts/thought-wizard";
import { requireUser } from "@/lib/auth/session";

export const metadata: Metadata = { title: "New thought" };

export default async function NewThoughtPage() {
  // The layout already checks, but a page that writes data re-checks on the server.
  await requireUser();

  return (
    <>
      <PageHeader
        title="What's taking up space in your mind?"
        description="Eight short steps. Nothing is saved to your account until the last one, and your progress is kept on this device as you go."
      />
      <ThoughtWizard />
    </>
  );
}
