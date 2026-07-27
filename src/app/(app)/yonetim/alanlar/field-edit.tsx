"use client";

import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Pencil } from "lucide-react";
import { updateFieldDefinition, type FieldDefState } from "./actions";
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
import type { FieldDefinition } from "@/lib/fields/types";

const TYPE_LABEL: Record<string, string> = {
  text: "Metin",
  textarea: "Uzun metin",
  number: "Sayı",
  date: "Tarih",
  boolean: "Var/Yok",
  select: "Seçmeli",
  multiselect: "Çoklu seçmeli",
};

export function FieldEdit({ def }: { def: FieldDefinition }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const save = updateFieldDefinition.bind(null, def.id);
  const [state, action, pending] = useActionState<FieldDefState, FormData>(
    save,
    null,
  );

  useEffect(() => {
    if (state && "ok" in state && state.ok) {
      setOpen(false);
      router.refresh();
    }
  }, [state, router]);

  const hasOptions = def.type === "select" || def.type === "multiselect";

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <button
            type="button"
            aria-label={`${def.label} alanını düzenle`}
            className="press grid size-8 place-items-center rounded-lg text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
          >
            <Pencil className="size-4" />
          </button>
        }
      />
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Alanı düzenle</DialogTitle>
        </DialogHeader>
        {open ? (
          <form action={action} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="edit-label">Etiket</Label>
              <Input
                id="edit-label"
                name="label"
                defaultValue={def.label}
                required
                autoFocus
              />
            </div>
            <div className="space-y-1.5">
              <Label>Tür</Label>
              <p className="flex items-center gap-2 rounded-xl bg-muted/50 px-3 py-2 text-sm ring-1 ring-foreground/[0.04]">
                <span className="rounded-md bg-accent px-2 py-0.5 text-xs text-accent-foreground">
                  {TYPE_LABEL[def.type] ?? def.type}
                </span>
                <span className="text-xs text-muted-foreground">
                  Tür sonradan değiştirilemez.
                </span>
              </p>
            </div>
            {hasOptions ? (
              <div className="space-y-1.5">
                <Label htmlFor="edit-options">Seçenekler</Label>
                <Textarea
                  id="edit-options"
                  name="options"
                  defaultValue={def.options.join("\n")}
                  placeholder="Her satıra bir seçenek"
                />
                <p className="text-xs text-muted-foreground">
                  Bir seçeneği kaldırmak mevcut kayıtlardaki değerini silmez;
                  yalnız yeni girişlerde listelenmez.
                </p>
              </div>
            ) : null}
            <label className="press flex cursor-pointer items-center gap-2.5 rounded-xl bg-muted/50 px-3 py-2.5 text-sm ring-1 ring-foreground/[0.04] transition-colors hover:bg-muted">
              <input
                type="checkbox"
                name="required"
                defaultChecked={def.required}
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
              {pending ? "Kaydediliyor..." : "Kaydet"}
            </Button>
          </form>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
