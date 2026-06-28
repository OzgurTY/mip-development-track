"use client";

import { useActionState, useEffect, useMemo, useState } from "react";
import { Plus } from "lucide-react";
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
import type { InfraType } from "@/lib/infra/types";

export function EntryForm({
  customerId,
  defs,
  types,
}: {
  customerId: string;
  defs: FieldDefinition[];
  types: InfraType[];
}) {
  const [open, setOpen] = useState(false);
  const [type, setType] = useState(types[0]?.key ?? "diger");
  const save = saveInfraEntry.bind(null, customerId);
  const [state, action, pending] = useActionState<SaveState, FormData>(
    save,
    null,
  );

  useEffect(() => {
    if (state && "ok" in state && state.ok) setOpen(false);
  }, [state]);

  const typeFields = useMemo(
    () => defs.filter((d) => d.group === type),
    [defs, type],
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button className="press gap-2">
            <Plus className="size-4" />
            Yeni kayıt
          </Button>
        }
      />
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Yeni altyapı kaydı</DialogTitle>
        </DialogHeader>
        <form action={action} className="space-y-5">
          <FormSection>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="type">Tür</Label>
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
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="label">Etiket</Label>
                <Input id="label" name="label" required autoFocus />
              </div>
            </div>
          </FormSection>

          {typeFields.length > 0 ? (
            <FormSection
              title={`${types.find((t) => t.key === type)?.label ?? ""} alanları`}
              description="Hassas alanlar şifreli saklanır"
            >
              <DynamicFields defs={typeFields} />
            </FormSection>
          ) : (
            <p className="text-sm text-muted-foreground">
              Bu tip için tanımlı alan yok. Yönetim &rarr; Altyapı&apos;dan
              ekleyebilirsin. Kullanıcıları kayıt oluştuktan sonra Kimlikler
              bölümünden eklersin.
            </p>
          )}

          <FormSection>
            <div className="space-y-1.5">
              <Label htmlFor="notes">Notlar</Label>
              <Textarea id="notes" name="notes" />
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
      </DialogContent>
    </Dialog>
  );
}
