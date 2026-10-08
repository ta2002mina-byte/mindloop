interface PageSectionProps {
  title: string;
  description?: string;
  children: React.ReactNode;
}

/** A titled group on a page, used for the "Ready / Waiting / Reviewed" stages. */
export function PageSection({ title, description, children }: PageSectionProps) {
  return (
    <section className="space-y-4">
      <div className="space-y-1">
        <h2 className="text-lg font-semibold">{title}</h2>
        {description ? <p className="text-sm text-muted-foreground">{description}</p> : null}
      </div>
      {children}
    </section>
  );
}
