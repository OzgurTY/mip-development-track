import { cn } from "@/lib/utils";

const STATUS_TONE: Record<string, string> = {
  Aktif: "bg-chart-3/15 text-foreground ring-chart-3/30",
  Stabil: "bg-chart-1/15 text-foreground ring-chart-1/30",
  Beklemede: "bg-chart-4/20 text-foreground ring-chart-4/40",
  İnaktif: "bg-muted text-muted-foreground ring-border",
};

export function StatusBadge({ status }: { status: string | null }) {
  if (!status) return <span className="text-muted-foreground">-</span>;
  const tone =
    STATUS_TONE[status] ?? "bg-muted text-muted-foreground ring-border";
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset",
        tone,
      )}
    >
      {status}
    </span>
  );
}

export function DriftBadge({ behind }: { behind: number }) {
  if (behind <= 0) {
    return (
      <span className="inline-flex items-center rounded-full bg-chart-3/15 px-2 py-0.5 text-xs font-medium text-foreground ring-1 ring-inset ring-chart-3/30">
        Güncel
      </span>
    );
  }
  return (
    <span className="inline-flex items-center rounded-full bg-destructive/15 px-2 py-0.5 text-xs font-medium text-destructive ring-1 ring-inset ring-destructive/30">
      {behind} geride
    </span>
  );
}
