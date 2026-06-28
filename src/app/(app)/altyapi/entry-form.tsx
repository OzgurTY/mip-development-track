"use client";

import type { ReactElement } from "react";
import { useActionState, useEffect, useMemo, useState } from "react";
import { Plus, Pencil } from "lucide-react";
import { saveInfraEntry, type SaveState } from "@/lib/infra/actions";
import { DynamicFields } from "@/components/fields/dynamic-fields";
import { FormSection } from "@/components/form-section";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import type { FieldDefinition } from "@/lib/fields/types";
import type { InfraEntry, InfraType } from "@/lib/infra/types";

export function EntryForm({
  customerId,
  defs,
  types,
  entry,
  trigger,
}: {
  customerId: string;
  defs: FieldDefinition[];
  types: InfraType[];
  entry?: InfraEntry;
  trigger?: ReactElement;
}) {
  const isEdit = Boolean(entry);
  const [open, setOpen] = useState(false);
  const [type, setType] = useState(
    entry?.type ?? types[0]?.key ?? "diger",
  );
  const save = saveInfraEntry.bind(null, entry?.id ?? null, customerId);
  const [state, action, pending] = useActionState<SaveState, FormData>(
    save,
    null,
  );

  useEffect(() => {
    if (state && "ok" in state && state.ok) setOpen(false);
  }, [state]);

  const effectiveType = isEdit ? (entry!.type as string) : type;
  const typeFields = useMemo(
    () => defs.filter((d) => d.group === effectiveType),
    [defs, effectiveType],
  );
  const values = useMemo(
    () =>
      entry
        ? Object.fromEntries(entry.fields.map((f) => [f.key, f.value]))
        : undefined,
    [entry],
  );

  const defaultTrigger = isEdit ? (
    <Button variant="outline" size="sm" className="press gap-1.5">
      <Pencil className="size-3.5" />
      Düzenle
    </Button>
  ) : (
    <Button className="press gap-2">
      <Plus className="size-4" />
      Yeni kayıt
    </Button>
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={trigger ?? defaultTrigger} />
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? `${entry!.label} düzenle` : "Yeni altyapı kaydı"}
          </DialogTitle>
        </DialogHeader>
        {open ? (
        <form action={action} className="space-y-5">
          <FormSection>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="type">Tür</Label>
                {isEdit ? (
                  <>
                    <input type="hidden" name="type" value={effectiveType} />
                    <div className="flex h-10 items-center rounded-xl bg-muted/50 px-3 text-sm text-muted-foreground">
                      {entry!.typeLabel}
                    </div>
                  </>
                ) : (
                  <Select
                    id="type"
                    name="type"
                    value={type}
                    onChange={(e) => setType(e.target.value)}
                  >
                    {types.map((t) => (
                      <option key={t.key} value={t.key}>
                        {t.label}
                      </option>
                    ))}
                  </Select>
                )}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="label">Etiket</Label>
                <Input
                  id="label"
                  name="label"
                  required
                  autoFocus
                  defaultValue={entry?.label ?? ""}
                />
              </div>
            </div>
          </FormSection>

          {typeFields.length > 0 ? (
            <FormSection
              title={`${types.find((t) => t.key === effectiveType)?.label ?? entry?.typeLabel ?? ""} alanları`}
              description="Hassas alanlar şifreli saklanır"
            >
              <DynamicFields defs={typeFields} values={values} />
            </FormSection>
          ) : (
            <p className="text-sm text-muted-foreground">
              Bu tip için tanımlı alan yok. Yönetim &rarr; Altyapı&apos;dan
              ekleyebilirsin. Kullanıcıları Kimlikler bölümünden eklersin.
            </p>
          )}

          <FormSection>
            <div className="space-y-1.5">
              <Label htmlFor="notes">Notlar</Label>
              <Textarea id="notes" name="notes" defaultValue={entry?.notes ?? ""} />
            </div>
          </FormSection>

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
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
