"use client";

import type { CSSProperties } from "react";
import { Plus, Trash2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";

export type RowColumn<T> = {
  key: keyof T & string;
  label: string;
  /** CSS grid fraction, orn. "2fr" veya "120px". */
  width: string;
  kind?: "text" | "date" | "number" | "select";
  options?: readonly string[];
  placeholder?: string;
};

type Props<T extends Record<string, string>> = {
  columns: RowColumn<T>[];
  rows: T[];
  empty: T;
  onChange: (rows: T[]) => void;
  addLabel: string;
  disabled?: boolean;
  emptyHint?: string;
};

/**
 * Tekrar eden satir bloklari icin ortak editor (surecler, isler, testler,
 * kriterler, acik konular). Satirlar her zaman yeni dizi olarak uretilir.
 */
export function RowEditor<T extends Record<string, string>>({
  columns,
  rows,
  empty,
  onChange,
  addLabel,
  disabled,
  emptyHint,
}: Props<T>) {
  // Telefonda satirlar alt alta yigilir; kolon duzeni sm ve uzerinde devreye girer.
  const template = {
    "--row-cols": `${columns.map((c) => c.width).join(" ")} 2rem`,
  } as CSSProperties;

  function update(index: number, key: keyof T & string, value: string) {
    onChange(rows.map((row, i) => (i === index ? { ...row, [key]: value } : row)));
  }

  function remove(index: number) {
    onChange(rows.filter((_, i) => i !== index));
  }

  return (
    <div className="space-y-2">
      {rows.length > 0 ? (
        <div
          className="hidden gap-2 px-1 text-[11px] font-semibold tracking-wide text-muted-foreground uppercase sm:grid sm:[grid-template-columns:var(--row-cols)]"
          style={template}
        >
          {columns.map((c) => (
            <span key={c.key}>{c.label}</span>
          ))}
          <span className="sr-only">İşlem</span>
        </div>
      ) : (
        <p className="rounded-xl bg-muted/50 px-3 py-2.5 text-sm text-muted-foreground">
          {emptyHint ?? "Kayıt yok."}
        </p>
      )}

      {rows.map((row, index) => (
        <div
          key={index}
          className="grid gap-2 rounded-xl bg-card p-2.5 ring-1 ring-foreground/[0.06] sm:items-center sm:rounded-none sm:bg-transparent sm:p-0 sm:ring-0 sm:[grid-template-columns:var(--row-cols)]"
          style={template}
        >
          {columns.map((column) => (
            <div key={column.key} className="min-w-0">
              <span className="mb-1 block text-[11px] text-muted-foreground sm:hidden">
                {column.label}
              </span>
              {column.kind === "select" ? (
                <Select
                  aria-label={column.label}
                  value={row[column.key]}
                  disabled={disabled}
                  onChange={(e) => update(index, column.key, e.target.value)}
                  className="h-9 rounded-lg text-sm"
                >
                  <option value="">Seçiniz</option>
                  {(column.options ?? []).map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </Select>
              ) : (
                <Input
                  aria-label={column.label}
                  type={column.kind === "date" ? "date" : "text"}
                  inputMode={column.kind === "number" ? "numeric" : undefined}
                  placeholder={column.placeholder}
                  value={row[column.key]}
                  disabled={disabled}
                  onChange={(e) => update(index, column.key, e.target.value)}
                  className="h-9 rounded-lg"
                />
              )}
            </div>
          ))}
          <button
            type="button"
            onClick={() => remove(index)}
            disabled={disabled}
            aria-label={`${index + 1}. satırı sil`}
            className="press grid size-8 place-items-center justify-self-end rounded-lg text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive disabled:opacity-40 sm:self-center sm:justify-self-auto"
          >
            <Trash2 className="size-4" />
          </button>
        </div>
      ))}

      <button
        type="button"
        onClick={() => onChange([...rows, { ...empty }])}
        disabled={disabled}
        className="press inline-flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-sm font-medium text-primary transition-colors hover:bg-primary/10 disabled:opacity-40"
      >
        <Plus className="size-3.5" />
        {addLabel}
      </button>
    </div>
  );
}
