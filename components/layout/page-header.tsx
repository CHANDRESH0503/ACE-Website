import type { ReactNode } from "react";

/** Shared header for inner pages: large display title and a short description. */
export function PageHeader({
  title,
  description,
}: {
  title: string;
  description?: ReactNode;
}) {
  return (
    <header className="mb-14 grid gap-6 border-b border-border pb-10 pt-10 sm:mb-20 sm:pt-16 lg:grid-cols-12 lg:items-end">
      <h1 data-reveal className="font-display text-[clamp(3rem,8vw,7.5rem)] lg:col-span-8">
        <span className="reveal-line">
          <span>{title}</span>
        </span>
      </h1>
      <div data-fade className="space-y-3 lg:col-span-4">
        {description && <p className="text-lg leading-snug text-muted-foreground">{description}</p>}
      </div>
    </header>
  );
}
