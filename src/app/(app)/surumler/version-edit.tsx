"use client";

import type { ReactElement } from "react";
import { useActionState, useEffect, useState } from "react";
import { saveVersionRecord, type SaveState } from "@/lib/versions/actions";
import { DynamicFields } from "@/components/fields/dynamic-fields";
import { FormSection } from "@/components/form-section";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import type { VersionRecord } from "@/lib/versions/types";
import type { FieldDefinition } from "@/lib/fields/types";

type Props = {
  customerId: string;
  customerName: string;
  record: VersionRecord | null;
  defs: FieldDefinition[];
  trigger: ReactElement;
};

const CORE: { key: keyof VersionRecord; label: string; options: string[] }[] = [
  { key: "system", label: "Sistem", options: ["Prod", "Dev", "POC", "Ortak Sistem Prd"] },
  { key: "deployment", label: "Konum", options: ["OnPremise", "Cloud-Logosoft", "Cloud-Bulutistan"] },
  { key: "os", label: "İşletim Sistemi", options: ["Ubuntu", "Windows Server"] },
  { key: "status", label: "Durum", options: ["Active", "İnaktif"] },
  { key: "package", label: "Paket", options: ["Basic", "Pro"] },
  { key: "middleware", label: "Middleware", options: ["MIP"] },
];

export function VersionEdit({
  customerId,
  customerName,
  record,
  defs,
  trigger,
}: Props) {
  const [open, setOpen] = useState(false);
  const save = saveVersionRecord.bind(null, record?.id ?? null, customerId);
  const [state, action, pending] = useActionState<SaveState, FormData>(
    save,
    null,
  );

  useEffect(() => {
    if (state && "ok" in state && state.ok) setOpen(false);
  }, [state]);

  const values = record?.custom_fields;
  const boolDefs = defs.filter((d) => d.type === "boolean");
  const noteDef = defs.find((d) => d.key === "note");
  const compDefs = defs.filter((d) => d.type !== "boolean" && d.key !== "note");

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={trigger} />
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{customerName} - sürüm kaydı</DialogTitle>
        </DialogHeader>
        <form action={action} className="space-y-5">
          <FormSection title="Çekirdek">
            <div className="grid gap-3 sm:grid-cols-2">
              {CORE.map(({ key, label, options }) => (
                <div key={key} className="space-y-1.5">
                  <Label htmlFor={key}>{label}</Label>
                  <Select
                    id={key}
                    name={key}
                    defaultValue={(record?.[key] as string | null) ?? ""}
                  >
                    <option value="">Seçiniz</option>
                    {options.map((o) => (
                      <option key={o} value={o}>
                        {o}
                      </option>
                    ))}
                  </Select>
                </div>
              ))}
            </div>
          </FormSection>

          {compDefs.length > 0 ? (
            <FormSection title="Bileşen sürümleri">
              <div className="grid gap-3 sm:grid-cols-2">
                <DynamicFields defs={compDefs} values={values} />
              </div>
            </FormSection>
          ) : null}

          {boolDefs.length > 0 ? (
            <FormSection
              title="Ek özellikler"
              description="İşaretli = var"
            >
              <div className="grid gap-2 sm:grid-cols-2">
                <DynamicFields defs={boolDefs} values={values} />
              </div>
            </FormSection>
          ) : null}

          {noteDef ? (
            <FormSection>
              <DynamicFields defs={[noteDef]} values={values} />
            </FormSection>
          ) : null}

          {state && "error" in state ? (
            <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {state.error}
            </p>
          ) : null}

          <Button
            type="submit"
            size="lg"
            className="press h-10 w-full"
            disabled={pending}
          >
            {pending ? "Kaydediliyor..." : "Kaydet"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
