import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type Props = {
  title?: string;
  icon?: LucideIcon;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
  bodyClassName?: string;
  hover?: boolean;
};

export function BentoCard({
  title,
  icon: Icon,
  action,
  children,
  className,
  bodyClassName,
  hover = false,
}: Props) {
  return (
    <section className={cn("bento flex flex-col p-5", hover && "bento-hover", className)}>
      {title || action ? (
        <header className="mb-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            {Icon ? (
              <span className="grid size-8 place-items-center rounded-xl bg-accent text-accent-foreground">
                <Icon className="size-4" strokeWidth={2.25} />
              </span>
            ) : null}
            {title ? (
              <h2 className="text-sm font-semibold tracking-tight">{title}</h2>
            ) : null}
          </div>
          {action}
        </header>
      ) : null}
      <div className={cn("min-h-0 flex-1", bodyClassName)}>{children}</div>
    </section>
  );
}
