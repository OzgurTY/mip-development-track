"use client";

import { useActionState, useEffect, useState } from "react";
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
import { INFRA_TYPES } from "@/lib/infra/types";
import type { FieldDefinition } from "@/lib/fields/types";

export function EntryForm({
  customerId,
  defs,
}: {
  customerId: string;
  defs: FieldDefinition[];
}) {
  const [open, setOpen] = useState(false);
  const save = saveInfraEntry.bind(null, customerId);
  const [state, action, pending] = useActionState<SaveState, FormData>(
    save,
    null,
  );

  useEffect(() => {
    if (state && "ok" in state && state.ok) setOpen(false);
  }, [state]);

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
                <Select id="type" name="type" defaultValue="sunucu">
                  {INFRA_TYPES.map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
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

          {defs.length > 0 ? (
            <FormSection title="Alanlar" description="Hassas alanlar şifreli saklanır">
              <DynamicFields defs={defs} />
            </FormSection>
          ) : null}

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
