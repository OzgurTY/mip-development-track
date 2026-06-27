"use client";

import { useActionState, useEffect, useState } from "react";
import { saveInfraEntry, type SaveState } from "@/lib/infra/actions";
import { DynamicFields } from "@/components/fields/dynamic-fields";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
      <DialogTrigger render={<Button>Yeni kayıt</Button>} />
      <DialogContent className="max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Yeni altyapı kaydı</DialogTitle>
        </DialogHeader>
        <form action={action} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="type">Tür</Label>
            <select
              id="type"
              name="type"
              defaultValue="sunucu"
              className="h-9 w-full rounded-md border bg-transparent px-3 text-sm"
            >
              {INFRA_TYPES.map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="label">Etiket</Label>
            <Input id="label" name="label" required autoFocus />
          </div>
          <DynamicFields defs={defs} />
          <div className="space-y-1.5">
            <Label htmlFor="notes">Notlar</Label>
            <Textarea id="notes" name="notes" />
          </div>
          {state && "error" in state && (
            <p className="text-sm text-destructive">{state.error}</p>
          )}
          <Button type="submit" disabled={pending}>
            {pending ? "Kaydediliyor..." : "Kaydet"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
