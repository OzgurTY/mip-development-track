"use client";

import { useState } from "react";
import { Download } from "lucide-react";

type Format = "xlsx" | "csv";

type Props = {
  customerId?: string;
  label?: string;
  compact?: boolean;
};

// Two-step export: pick a format, then press "Dışa aktar". Nothing downloads on
// format selection, so a stray click can't trigger an export. The action is a
// plain <a download> whose href tracks the chosen format.
export function ExportControl({
  customerId,
  label = "Dışa aktar",
  compact,
}: Props) {
  const [format, setFormat] = useState<Format>("xlsx");
  const params = customerId
    ? `scope=customer&customerId=${customerId}`
    : "scope=all";
  const href = `/api/takip/export?${params}&format=${format}`;

  return (
    <div className="inline-flex items-center gap-1 rounded-xl bg-muted/60 p-1 ring-1 ring-foreground/[0.05]">
      <FormatButton active={format === "xlsx"} onClick={() => setFormat("xlsx")}>
        Excel
      </FormatButton>
      <FormatButton active={format === "csv"} onClick={() => setFormat("csv")}>
        CSV
      </FormatButton>
      <span className="mx-0.5 h-4 w-px bg-foreground/10" />
      <a
        href={href}
        download
        className="press inline-flex items-center gap-1.5 rounded-lg bg-primary/10 px-3 py-1 text-sm font-medium text-primary transition-colors hover:bg-primary/20"
      >
        <Download className="size-3.5" />
        {compact ? "Aktar" : label}
      </a>
    </div>
  );
}

function FormatButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={
        active
          ? "press rounded-lg bg-card px-2.5 py-1 text-sm font-medium shadow-sm ring-1 ring-foreground/[0.06]"
          : "press rounded-lg px-2.5 py-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
      }
    >
      {children}
    </button>
  );
}
