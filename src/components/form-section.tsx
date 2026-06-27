import type { ReactNode } from "react";

type Props = {
  title?: string;
  description?: string;
  children: ReactNode;
};

// A labelled group inside a form dialog, with a subtle separator above it.
export function FormSection({ title, description, children }: Props) {
  return (
    <section className="space-y-3 border-t border-border/60 pt-4 first:border-0 first:pt-0">
      {title ? (
        <div>
          <h3 className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
            {title}
          </h3>
          {description ? (
            <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>
          ) : null}
        </div>
      ) : null}
      {children}
    </section>
  );
}
