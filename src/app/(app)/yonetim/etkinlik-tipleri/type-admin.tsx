"use client";

import { useActionState, useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import {
  createEventType,
  deleteEventType,
  type SaveState,
} from "@/lib/events/actions";
import { tint } from "@/components/status-badge";
import { useConfirm } from "@/components/ui/confirm-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import type { EventType } from "@/lib/events/types";

/** Yeni renk uretilmez: mevcut accent rampasi. */
const COLORS = [
  { value: "var(--accent-indigo)", label: "İndigo" },
  { value: "var(--accent-violet)", label: "Mor" },
  { value: "var(--accent-sky)", label: "Mavi" },
  { value: "var(--accent-emerald)", label: "Yeşil" },
  { value: "var(--accent-amber)", label: "Amber" },
  { value: "var(--accent-rose)", label: "Kırmızı" },
  { value: "var(--muted-foreground)", label: "Gri" },
];

type Props = {
  types: EventType[];
  usage: Record<string, number>;
};

export function EventTypeAdmin({ types, usage }: Props) {
  const router = useRouter();
  const confirm = useConfirm();
  const formRef = useRef<HTMLFormElement>(null);
  const [pending, startTransition] = useTransition();
  const [state, formAction, saving] = useActionState<SaveState, FormData>(
    createEventType,
    null,
  );
  const [color, setColor] = useState(COLORS[0].value);

  useEffect(() => {
    if (state && "ok" in state && state.ok) {
      formRef.current?.reset();
      router.refresh();
    }
  }, [state, router]);

  async function handleDelete(type: EventType) {
    const count = usage[type.key] ?? 0;
    const ok = await confirm({
      title: "Etkinlik tipini sil",
      description: (
        <>
          <strong>{type.label}</strong> tipi silinecek.
          {count > 0
            ? ` Bu tipteki ${count} etkinlik silinmez, tipsiz kalır.`
            : ""}
        </>
      ),
      confirmLabel: "Sil",
    });
    if (!ok) return;
    startTransition(async () => {
      const result = await deleteEventType(type.key);
      if (result.error) {
        toast.error(result.error);
        return;
      }
      toast.success("Tip silindi");
      router.refresh();
    });
  }

  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_20rem]">
      <section className="bento overflow-hidden">
        <h2 className="border-b border-border/60 bg-muted/40 px-4 py-2.5 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
          Tipler
          <span className="ml-2 normal-case opacity-70">{types.length} tip</span>
        </h2>
        <ul>
          {types.map((type) => (
            <li
              key={type.key}
              className="group flex items-center gap-3 border-b border-border/50 px-4 py-2.5 last:border-b-0"
            >
              <span
                className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium"
                style={tint(type.color)}
              >
                <span
                  className="size-1.5 rounded-full"
                  style={{ background: type.color }}
                />
                {type.label}
              </span>
              <code className="text-xs text-muted-foreground">{type.key}</code>
              <span className="ml-auto text-xs text-muted-foreground">
                {usage[type.key] ?? 0} etkinlik
              </span>
              <button
                type="button"
                onClick={() => handleDelete(type)}
                disabled={pending}
                aria-label={`${type.label} tipini sil`}
                className="press grid size-8 place-items-center rounded-lg text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive disabled:opacity-40"
              >
                <Trash2 className="size-4" />
              </button>
            </li>
          ))}
        </ul>
      </section>

      <section className="bento h-fit p-5">
        <h2 className="mb-4 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
          Yeni tip
        </h2>
        <form ref={formRef} action={formAction} className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="label">Etiket</Label>
            <Input
              id="label"
              name="label"
              required
              maxLength={80}
              placeholder="Örn. Hackathon"
              className="h-10 rounded-xl px-3"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="key">Anahtar</Label>
            <Input
              id="key"
              name="key"
              required
              maxLength={40}
              pattern="[a-z0-9_]+"
              placeholder="hackathon"
              className="h-10 rounded-xl px-3"
            />
            <p className="text-xs text-muted-foreground">
              Küçük harf, sayı ve alt çizgi. Sonradan değiştirilemez.
            </p>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="color">Renk</Label>
            <Select
              id="color"
              name="color"
              value={color}
              onChange={(e) => setColor(e.target.value)}
            >
              {COLORS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </Select>
            <span
              className="mt-1 inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium"
              style={tint(color)}
            >
              <span
                className="size-1.5 rounded-full"
                style={{ background: color }}
              />
              Önizleme
            </span>
          </div>

          {state && "error" in state ? (
            <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {state.error}
            </p>
          ) : null}

          <Button
            type="submit"
            size="lg"
            className="press h-10 w-full gap-2"
            disabled={saving}
          >
            <Plus className="size-4" />
            {saving ? "Ekleniyor..." : "Tip ekle"}
          </Button>
        </form>
      </section>
    </div>
  );
}
