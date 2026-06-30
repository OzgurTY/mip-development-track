"use client";

import { useActionState, useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2, X } from "lucide-react";
import {
  createInfraType,
  deleteInfraType,
  type TypeState,
} from "@/lib/infra/type-actions";
import { FieldList } from "./field-list";
import { FieldForm } from "./field-form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useConfirm } from "@/components/ui/confirm-dialog";
import type { FieldDefinition } from "@/lib/fields/types";
import type { InfraType } from "@/lib/infra/types";

export function InfraFieldAdmin({
  types,
  fieldsByType,
}: {
  types: InfraType[];
  fieldsByType: Record<string, FieldDefinition[]>;
}) {
  const router = useRouter();
  const confirm = useConfirm();
  const [active, setActive] = useState(types[0]?.key ?? "");
  const [adding, setAdding] = useState(false);
  const [pending, startTransition] = useTransition();
  const [state, addAction] = useActionState<TypeState, FormData>(
    createInfraType,
    null,
  );

  useEffect(() => {
    if (state && "ok" in state && state.ok) {
      setAdding(false);
      router.refresh();
    }
  }, [state, router]);

  const current = types.find((t) => t.key === active) ?? types[0];
  const fields = current ? (fieldsByType[current.key] ?? []) : [];

  async function removeType(t: InfraType) {
    const ok = await confirm({
      title: "Tipi kaldır",
      description: (
        <>
          <strong>{t.label}</strong> tipi listeden çıkarılacak. Mevcut alan ve
          kayıtlar silinmez.
        </>
      ),
      confirmLabel: "Kaldır",
    });
    if (!ok) return;
    startTransition(async () => {
      await deleteInfraType(t.id);
      if (active === t.key) {
        setActive(types.find((x) => x.key !== t.key)?.key ?? "");
      }
      router.refresh();
    });
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <div className="inline-flex flex-wrap gap-1 rounded-2xl bg-muted/60 p-1">
          {types.map((t) => (
            <button
              key={t.key}
              type="button"
              onClick={() => setActive(t.key)}
              className={
                active === t.key
                  ? "press inline-flex items-center gap-1.5 rounded-xl bg-card px-3 py-1.5 text-sm font-semibold shadow-[var(--shadow-soft)]"
                  : "press inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
              }
            >
              {t.label}
              <span className="text-xs tabular-nums opacity-60">
                {(fieldsByType[t.key] ?? []).length}
              </span>
            </button>
          ))}
        </div>
        {adding ? (
          <form action={addAction} className="flex items-center gap-1.5">
            <Input
              name="label"
              placeholder="Yeni tip adı"
              autoFocus
              className="h-9 w-40"
            />
            <Button type="submit" size="sm" className="press">
              Ekle
            </Button>
            <button
              type="button"
              onClick={() => setAdding(false)}
              aria-label="İptal"
              className="press grid size-8 place-items-center rounded-lg text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
            >
              <X className="size-4" />
            </button>
          </form>
        ) : (
          <Button
            variant="outline"
            size="sm"
            className="press gap-1"
            onClick={() => setAdding(true)}
          >
            <Plus className="size-4" />
            Tip ekle
          </Button>
        )}
      </div>
      {state && "error" in state ? (
        <p className="text-sm text-destructive">{state.error}</p>
      ) : null}

      {current ? (
        <>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-muted-foreground">
              <span className="font-medium text-foreground">
                {current.label}
              </span>{" "}
              tipine ait alanlar. Altyapı eklerken bu tip seçilince yalnız bu
              alanlar gösterilir.
            </p>
            <div className="flex items-center gap-2">
              <FieldForm entity="infra" group={current.key} />
              <button
                type="button"
                onClick={() => removeType(current)}
                disabled={pending}
                aria-label={`${current.label} tipini sil`}
                className="press grid size-8 place-items-center rounded-lg text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive disabled:opacity-50"
              >
                <Trash2 className="size-4" />
              </button>
            </div>
          </div>
          <FieldList defs={fields} />
        </>
      ) : (
        <p className="py-8 text-center text-sm text-muted-foreground">
          Henüz tip yok. &quot;Tip ekle&quot; ile başla.
        </p>
      )}
    </div>
  );
}
