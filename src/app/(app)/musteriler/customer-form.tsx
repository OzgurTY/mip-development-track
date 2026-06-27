"use client";

import { useActionState, useEffect, useState } from "react";
import { Plus } from "lucide-react";
import { createCustomer, type CreateState } from "./actions";
import { DynamicFields } from "@/components/fields/dynamic-fields";
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

export function CustomerForm({ defs }: { defs: FieldDefinition[] }) {
  const [open, setOpen] = useState(false);
  const [state, action, pending] = useActionState<CreateState, FormData>(
    createCustomer,
    null,
  );

  useEffect(() => {
    if (state && "ok" in state && state.ok) setOpen(false);
  }, [state]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button size="lg" className="press h-10 gap-2">
            <Plus className="size-4" />
            Yeni müşteri
          </Button>
        }
      />
      <DialogContent className="max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Yeni müşteri</DialogTitle>
        </DialogHeader>
        <form action={action} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="name">Müşteri adı</Label>
            <Input id="name" name="name" required autoFocus />
          </div>
          <DynamicFields defs={defs} />
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
