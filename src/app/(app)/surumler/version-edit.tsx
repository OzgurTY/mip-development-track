"use client";

import type { ReactElement } from "react";
import { useActionState, useEffect, useState } from "react";
import { saveVersionRecord, type SaveState } from "@/lib/versions/actions";
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
import type { VersionRecord } from "@/lib/versions/types";
import type { FieldDefinition } from "@/lib/fields/types";

type Props = {
  customerId: string;
  customerName: string;
  record: VersionRecord | null;
  defs: FieldDefinition[];
  trigger: ReactElement;
};

const CORE = [
  ["system", "Sistem"],
  ["deployment", "OnPremise/Cloud"],
  ["os", "OS"],
  ["status", "Status"],
  ["middleware", "Middleware"],
  ["package", "Package"],
] as const;

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

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={trigger} />
      <DialogContent className="max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{customerName} - sürüm</DialogTitle>
        </DialogHeader>
        <form action={action} className="space-y-4">
          {CORE.map(([key, label]) => (
            <div key={key} className="space-y-1.5">
              <Label htmlFor={key}>{label}</Label>
              <Input
                id={key}
                name={key}
                defaultValue={(record?.[key] as string | null) ?? ""}
              />
            </div>
          ))}
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
