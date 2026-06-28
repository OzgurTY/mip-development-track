"use client";

import { useActionState, useEffect, useState } from "react";
import { Plus } from "lucide-react";
import { createFieldDefinition, type FieldDefState } from "./actions";
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

const TYPES: [string, string][] = [
  ["text", "Metin"],
  ["textarea", "Uzun metin"],
  ["number", "Sayı"],
  ["date", "Tarih"],
  ["boolean", "Var/Yok (checkbox)"],
  ["select", "Seçmeli (dropdown)"],
  ["multiselect", "Çoklu seçmeli"],
];

export function FieldForm({
  entity,
  group,
}: {
  entity: string;
  group?: string;
}) {
  const [open, setOpen] = useState(false);
  const [type, setType] = useState("text");
  const [state, action, pending] = useActionState<FieldDefState, FormData>(
    createFieldDefinition,
    null,
  );

  useEffect(() => {
    if (state && "ok" in state && state.ok) {
      setOpen(false);
      setType("text");
    }
  }, [state]);

  const needsOptions = type === "select" || type === "multiselect";

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button size="sm" className="press gap-1.5">
            <Plus className="size-4" />
            Yeni alan
          </Button>
        }
      />
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Yeni alan</DialogTitle>
        </DialogHeader>
        <form action={action} className="space-y-4">
          <input type="hidden" name="entity" value={entity} />
          {group ? <input type="hidden" name="group" value={group} /> : null}
          <div className="space-y-1.5">
            <Label htmlFor="label">Etiket</Label>
            <Input id="label" name="label" required autoFocus />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="type">Tür</Label>
            <Select
              id="type"
              name="type"
              value={type}
              onChange={(e) => setType(e.target.value)}
            >
              {TYPES.map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </Select>
          </div>
          {needsOptions ? (
            <div className="space-y-1.5">
              <Label htmlFor="options">Seçenekler</Label>
              <Textarea
                id="options"
                name="options"
                placeholder="Her satıra bir seçenek"
              />
            </div>
          ) : null}
          <label className="press flex cursor-pointer items-center gap-2.5 rounded-xl bg-muted/50 px-3 py-2.5 text-sm ring-1 ring-foreground/[0.04] transition-colors hover:bg-muted">
            <input
              type="checkbox"
              name="required"
              className="size-4 rounded"
              style={{ accentColor: "var(--primary)" }}
            />
            <span className="font-medium">Zorunlu alan</span>
          </label>
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
            {pending ? "Ekleniyor..." : "Ekle"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
