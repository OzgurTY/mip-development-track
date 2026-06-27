const STATUS_COLOR: Record<string, string> = {
  Aktif: "var(--accent-emerald)",
  Stabil: "var(--accent-sky)",
  Beklemede: "var(--accent-amber)",
  İnaktif: "var(--accent-rose)",
};

function tint(color: string): React.CSSProperties {
  return {
    background: `color-mix(in oklch, ${color} 14%, transparent)`,
    boxShadow: `inset 0 0 0 1px color-mix(in oklch, ${color} 32%, transparent)`,
  };
}

export function StatusBadge({ status }: { status: string | null }) {
  if (!status) return <span className="text-muted-foreground">-</span>;
  const color = STATUS_COLOR[status] ?? "var(--muted-foreground)";
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium"
      style={tint(color)}
    >
      <span className="size-1.5 rounded-full" style={{ background: color }} />
      {status}
    </span>
  );
}

export function DriftBadge({ behind }: { behind: number }) {
  const ok = behind <= 0;
  const color = ok ? "var(--accent-emerald)" : "var(--accent-rose)";
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium whitespace-nowrap"
      style={tint(color)}
    >
      <span className="size-1.5 rounded-full" style={{ background: color }} />
      {ok ? "Güncel" : `${behind} geride`}
    </span>
  );
}
