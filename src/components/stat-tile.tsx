import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export type Accent =
  | "indigo"
  | "emerald"
  | "amber"
  | "rose"
  | "sky"
  | "violet";

const ACCENT_VAR: Record<Accent, string> = {
  indigo: "var(--accent-indigo)",
  emerald: "var(--accent-emerald)",
  amber: "var(--accent-amber)",
  rose: "var(--accent-rose)",
  sky: "var(--accent-sky)",
  violet: "var(--accent-violet)",
};

type Props = {
  label: string;
  value: number | string;
  icon: LucideIcon;
  accent: Accent;
  hint?: string;
  href?: string;
};

export function StatTile({ label, value, icon: Icon, accent, hint, href }: Props) {
  const color = ACCENT_VAR[accent];
  const inner = (
    <>
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage: `radial-gradient(150px 110px at 100% 0%, color-mix(in oklch, ${color} 20%, transparent), transparent)`,
        }}
      />
      <div className="relative flex items-start justify-between">
        <span
          className="grid size-11 place-items-center rounded-2xl text-white"
          style={{ background: color, boxShadow: `0 6px 16px -6px ${color}` }}
        >
          <Icon className="size-5" strokeWidth={2.25} />
        </span>
      </div>
      <div className="relative mt-4">
        <p
          className="font-display text-4xl font-bold tabular-nums"
          style={{ color }}
        >
          {value}
        </p>
        <p className="mt-1 text-sm font-medium">{label}</p>
        {hint ? (
          <p className="mt-0.5 text-xs text-muted-foreground">{hint}</p>
        ) : null}
      </div>
    </>
  );

  const base =
    "bento relative overflow-hidden p-5 animate-in fade-in slide-in-from-bottom-2 duration-500";

  if (href) {
    return (
      <Link href={href} className={cn(base, "bento-hover press block")}>
        {inner}
      </Link>
    );
  }
  return <div className={base}>{inner}</div>;
}
