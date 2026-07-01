import { Download } from "lucide-react";

type Props = {
  customerId?: string;
  label?: string;
  compact?: boolean;
};

// Plain download links (no JS): the route sends Content-Disposition, so the
// browser downloads the file. `customerId` scopes to one customer; omit for all.
export function ExportLinks({ customerId, label = "Dışa aktar", compact }: Props) {
  const params = customerId
    ? `scope=customer&customerId=${customerId}`
    : "scope=all";
  const href = (format: "xlsx" | "csv") =>
    `/api/takip/export?${params}&format=${format}`;

  return (
    <div className="inline-flex items-center gap-1 rounded-xl bg-muted/60 p-1 ring-1 ring-foreground/[0.05]">
      <span className="inline-flex items-center gap-1.5 px-2 text-xs text-muted-foreground">
        <Download className="size-3.5" />
        {!compact ? label : null}
      </span>
      <a
        href={href("xlsx")}
        download
        className="press rounded-lg px-2.5 py-1 text-sm font-medium text-foreground transition-colors hover:bg-card"
      >
        Excel
      </a>
      <a
        href={href("csv")}
        download
        className="press rounded-lg px-2.5 py-1 text-sm text-muted-foreground transition-colors hover:bg-card hover:text-foreground"
      >
        CSV
      </a>
    </div>
  );
}
