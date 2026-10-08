import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { PageHeader } from "@/components/layout/page-header";
import { ThoughtWizard } from "@/components/thoughts/thought-wizard";
import { thoughtRoute } from "@/lib/constants/routes";
import { draftFromDetail } from "@/lib/thoughts/draft";
import { getThoughtDetail } from "@/lib/thoughts/queries";

interface PageProps {
  params: Promise<{ id: string }>;
}

export const metadata: Metadata = { title: "Edit thought" };

export default async function EditThoughtPage({ params }: PageProps) {
  const { id } = await params;
  const thought = await getThoughtDetail(id);
  if (!thought) notFound();

  return (
    <>
      <div className="mb-4">
        <Link
          href={thoughtRoute(id)}
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Back to the thought
        </Link>
      </div>

      <PageHeader
        title="Edit this analysis"
        description="Every step is open. Completed actions stay as they are; an open action is replaced by whatever you set here."
      />

      {/* The wizard is the same component as /thoughts/new, just seeded with saved data. */}
      <ThoughtWizard thoughtId={thought.id} initialDraft={draftFromDetail(thought)} />
    </>
  );
}
