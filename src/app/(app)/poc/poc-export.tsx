"use client";

import { useState, useTransition } from "react";
import { Download } from "lucide-react";

type Format = "docx" | "pdf";

type Props = {
  id: string;
  /** Kaydedilmemis degisiklik varsa disa aktarmadan once kaydedilir. */
  isDirty: boolean;
  onSave: () => Promise<boolean>;
};

/**
 * Iki adimli disa aktarma: once bicim secilir, sonra "Dışa aktar" basilir.
 * Bicim secmek indirme baslatmaz. PDF, tarayicinin yazdirma penceresinden
 * uretilir; onizlemede gorulen sayfanin birebir aynisidir.
 */
export function PocExport({ id, isDirty, onSave }: Props) {
  const [format, setFormat] = useState<Format>("docx");
  const [pending, startTransition] = useTransition();

  function handleExport() {
    startTransition(async () => {
      if (isDirty && !(await onSave())) return;
      if (format === "docx") {
        window.location.href = `/api/poc/${id}/export?format=docx`;
        return;
      }
      window.open(`/poc/${id}/yazdir`, "_blank", "noopener");
    });
  }

  return (
    <div className="inline-flex items-center gap-1 rounded-xl bg-muted/60 p-1 ring-1 ring-foreground/[0.05]">
      <FormatButton active={format === "docx"} onClick={() => setFormat("docx")}>
        Word
      </FormatButton>
      <FormatButton active={format === "pdf"} onClick={() => setFormat("pdf")}>
        PDF
      </FormatButton>
      <span className="mx-0.5 h-4 w-px bg-foreground/10" />
      <button
        type="button"
        onClick={handleExport}
        disabled={pending}
        className="press inline-flex items-center gap-1.5 rounded-lg bg-primary/10 px-3 py-1 text-sm font-medium text-primary transition-colors hover:bg-primary/20 disabled:opacity-50"
      >
        <Download className="size-3.5" />
        {pending ? "Hazırlanıyor..." : "Dışa aktar"}
      </button>
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
