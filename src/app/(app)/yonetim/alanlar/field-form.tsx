"use client";

import { useActionState, useEffect, useState } from "react";
import { createFieldDefinition, type FieldDefState } from "./actions";
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

export function FieldForm({ entity }: { entity: string }) {
  const [open, setOpen] = useState(false);
  const [type, setType] = useState("text");
  const [state, action, pending] = useActionState<FieldDefState, FormData>(
    createFieldDefinition,
    null,
  );

  useEffect(() => {
    if (state && "ok" in state && state.ok) setOpen(false);
  }, [state]);

  const needsOptions = type === "select" || type === "multiselect";

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button>Yeni alan</Button>} />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Yeni alan</DialogTitle>
        </DialogHeader>
        <form action={action} className="space-y-4">
          <input type="hidden" name="entity" value={entity} />
          <div className="space-y-1.5">
            <Label htmlFor="label">Etiket</Label>
            <Input id="label" name="label" required autoFocus />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="type">Tür</Label>
            <select
              id="type"
              name="type"
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="h-9 w-full rounded-md border bg-transparent px-3 text-sm"
            >
              <option value="text">Metin</option>
              <option value="textarea">Uzun metin</option>
              <option value="number">Sayı</option>
              <option value="date">Tarih</option>
              <option value="boolean">Evet/Hayır</option>
              <option value="select">Seçmeli</option>
              <option value="multiselect">Çoklu seçmeli</option>
            </select>
          </div>
          {needsOptions && (
            <div className="space-y-1.5">
              <Label htmlFor="options">Seçenekler</Label>
              <Textarea
                id="options"
                name="options"
                placeholder="Her satıra bir seçenek"
              />
            </div>
          )}
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" name="required" /> Zorunlu alan
          </label>
          {state && "error" in state && (
            <p className="text-sm text-destructive">{state.error}</p>
          )}
          <Button type="submit" disabled={pending}>
            {pending ? "Ekleniyor..." : "Ekle"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
