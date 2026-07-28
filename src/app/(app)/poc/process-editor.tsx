"use client";

import { Plus, Trash2 } from "lucide-react";
import { RowEditor } from "./row-editor";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { METHOD_OPTIONS, newProcess } from "@/lib/poc/defaults";
import { CRITERION_STATUSES, TEST_RESULTS } from "@/lib/poc/types";
import type { PocCriterion, PocProcess } from "@/lib/poc/types";

type Props = {
  processes: PocProcess[];
  onChange: (processes: PocProcess[]) => void;
  disabled?: boolean;
};

/**
 * Surec merkezli editor: her surec kendi tanimini, mesaj sonuclarini ve
 * yalnizca kendisi icin gecerli kabul kriterlerini tasir.
 */
export function ProcessEditor({ processes, onChange, disabled }: Props) {
  function patch(index: number, values: Partial<PocProcess>) {
    onChange(
      processes.map((process, i) =>
        i === index ? { ...process, ...values } : process,
      ),
    );
  }

  function remove(index: number) {
    onChange(processes.filter((_, i) => i !== index));
  }

  return (
    <div className="space-y-3">
      {processes.length === 0 ? (
        <p className="rounded-xl bg-muted/50 px-3 py-2.5 text-sm text-muted-foreground">
          Müşterinin verdiği süreçleri buraya ekleyin. Her süreç kendi test
          sonucunu ve kabul kriterlerini taşır.
        </p>
      ) : null}

      {processes.map((process, index) => (
        <section
          key={index}
          className="space-y-4 rounded-2xl bg-muted/30 p-4 ring-1 ring-foreground/[0.06]"
        >
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
              Süreç {index + 1}
            </span>
            <button
              type="button"
              onClick={() => remove(index)}
              disabled={disabled}
              aria-label={`${index + 1}. süreci sil`}
              className="press grid size-8 place-items-center rounded-lg text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive disabled:opacity-40"
            >
              <Trash2 className="size-4" />
            </button>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor={`process-name-${index}`}>Süreç adı</Label>
              <Input
                id={`process-name-${index}`}
                value={process.name}
                disabled={disabled}
                placeholder="Örn. Sipariş aktarımı"
                onChange={(e) => patch(index, { name: e.target.value })}
                className="h-10 rounded-xl px-3"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor={`process-source-${index}`}>Kaynak sistem</Label>
              <Input
                id={`process-source-${index}`}
                value={process.source}
                disabled={disabled}
                onChange={(e) => patch(index, { source: e.target.value })}
                className="h-10 rounded-xl px-3"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor={`process-target-${index}`}>Hedef sistem</Label>
              <Input
                id={`process-target-${index}`}
                value={process.target}
                disabled={disabled}
                onChange={(e) => patch(index, { target: e.target.value })}
                className="h-10 rounded-xl px-3"
              />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor={`process-method-${index}`}>Yöntem</Label>
              <Select
                id={`process-method-${index}`}
                value={process.method}
                disabled={disabled}
                onChange={(e) => patch(index, { method: e.target.value })}
              >
                <option value="">Seçiniz</option>
                {METHOD_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-sm font-medium">Mesaj sonucu</p>
            <div className="grid gap-2 sm:grid-cols-4">
              <NumberField
                id={`process-sent-${index}`}
                label="Gönderilen"
                value={process.sent}
                disabled={disabled}
                onChange={(sent) => patch(index, { sent })}
              />
              <NumberField
                id={`process-ok-${index}`}
                label="Başarılı"
                value={process.ok}
                disabled={disabled}
                onChange={(ok) => patch(index, { ok })}
              />
              <NumberField
                id={`process-failed-${index}`}
                label="Hatalı"
                value={process.failed}
                disabled={disabled}
                onChange={(failed) => patch(index, { failed })}
              />
              <div className="space-y-1.5">
                <Label htmlFor={`process-result-${index}`}>Sonuç</Label>
                <Select
                  id={`process-result-${index}`}
                  value={process.result}
                  disabled={disabled}
                  onChange={(e) => patch(index, { result: e.target.value })}
                  className="h-10"
                >
                  <option value="">Seçiniz</option>
                  {TEST_RESULTS.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </Select>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-sm font-medium">Bu sürecin kabul kriterleri</p>
            <RowEditor<PocCriterion>
              columns={[
                { key: "text", label: "Kriter", width: "3fr" },
                {
                  key: "status",
                  label: "Durum",
                  width: "1.2fr",
                  kind: "select",
                  options: CRITERION_STATUSES,
                },
                { key: "note", label: "Not", width: "1.4fr" },
              ]}
              rows={process.criteria}
              empty={{ text: "", status: "", note: "" }}
              onChange={(criteria) => patch(index, { criteria })}
              addLabel="Kriter ekle"
              emptyHint="Bu süreç için kriter tanımlanmadı."
              disabled={disabled}
            />
          </div>
        </section>
      ))}

      <button
        type="button"
        onClick={() => onChange([...processes, newProcess()])}
        disabled={disabled}
        className="press inline-flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-sm font-medium text-primary transition-colors hover:bg-primary/10 disabled:opacity-40"
      >
        <Plus className="size-3.5" />
        Süreç ekle
      </button>
    </div>
  );
}

function NumberField({
  id,
  label,
  value,
  disabled,
  onChange,
}: {
  id: string;
  label: string;
  value: string;
  disabled?: boolean;
  onChange: (value: string) => void;
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      <Input
        id={id}
        inputMode="numeric"
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
        className="h-10 rounded-xl px-3"
      />
    </div>
  );
}
