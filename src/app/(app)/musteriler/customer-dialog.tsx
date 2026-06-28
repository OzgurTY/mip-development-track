"use client";

import { useActionState, useEffect, useState } from "react";
import type { ReactElement } from "react";
import { Plus, Pencil } from "lucide-react";
import { createCustomer, updateCustomer, type CreateState } from "./actions";
import { DynamicFields } from "@/components/fields/dynamic-fields";
import { FormSection } from "@/components/form-section";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import type { FieldDefinition } from "@/lib/fields/types";

type Customer = {
  id: string;
  name: string;
  is_active: boolean;
  custom_fields: Record<string, unknown>;
};

export function CustomerDialog({
  customer,
  defs,
  trigger,
}: {
  customer?: Customer;
  defs: FieldDefinition[];
  trigger?: ReactElement;
}) {
  const [open, setOpen] = useState(false);
  const isEdit = Boolean(customer);
  const action = isEdit ? updateCustomer.bind(null, customer!.id) : createCustomer;
  const [state, formAction, pending] = useActionState<CreateState, FormData>(
    action,
    null,
  );

  useEffect(() => {
    if (state && "ok" in state && state.ok) setOpen(false);
  }, [state]);

  const defaultTrigger = isEdit ? (
    <Button variant="outline" size="sm" className="press gap-1.5">
      <Pencil className="size-3.5" />
      Düzenle
    </Button>
  ) : (
    <Button size="lg" className="press h-10 gap-2">
      <Plus className="size-4" />
      Yeni müşteri
    </Button>
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={trigger ?? defaultTrigger} />
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? `${customer!.name} düzenle` : "Yeni müşteri"}
          </DialogTitle>
        </DialogHeader>
        {open ? (
        <form action={formAction} className="space-y-5">
          <FormSection>
            <div className="space-y-1.5">
              <Label htmlFor="name">Müşteri adı</Label>
              <Input
                id="name"
                name="name"
                required
                autoFocus
                defaultValue={customer?.name ?? ""}
              />
            </div>
            <label className="press flex cursor-pointer items-center gap-2.5 rounded-xl bg-muted/50 px-3 py-2.5 text-sm ring-1 ring-foreground/[0.04] transition-colors hover:bg-muted">
              <input
                type="checkbox"
                name="is_active"
                value="true"
                defaultChecked={customer ? customer.is_active : true}
                className="size-4 rounded"
                style={{ accentColor: "var(--primary)" }}
              />
              <span className="font-medium">Aktif müşteri</span>
            </label>
          </FormSection>

          {defs.length > 0 ? (
            <FormSection title="Özel alanlar">
              <DynamicFields defs={defs} values={customer?.custom_fields} />
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
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
