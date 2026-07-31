"use client";

import { useActionState, useEffect, useRef, useTransition } from "react";
import { useRouter } from "next/navigation";
import { CalendarX, Plus, RefreshCw, Trash2, TriangleAlert } from "lucide-react";
import { toast } from "sonner";
import {
  createEventSource,
  deleteEventSource,
  deleteSourceEvents,
  syncEventSource,
  type SourceState,
} from "@/lib/events/source-actions";
import { useConfirm } from "@/components/ui/confirm-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import type { EventSource } from "@/lib/events/source-types";

type Props = {
  sources: EventSource[];
  candidateCounts: Record<string, number>;
};

export function EventSourceAdmin({ sources, candidateCounts }: Props) {
  const router = useRouter();
  const confirm = useConfirm();
  const formRef = useRef<HTMLFormElement>(null);
  const [pending, startTransition] = useTransition();
  const [state, formAction, saving] = useActionState<SourceState, FormData>(
    createEventSource,
    null,
  );

  useEffect(() => {
    if (state && "ok" in state && state.ok) {
      formRef.current?.reset();
      router.refresh();
    }
  }, [state, router]);

  function sync(source: EventSource) {
    startTransition(async () => {
      const result = await syncEventSource(source.id);
      if (result.error) {
        toast.error(result.error);
        return;
      }
      toast.success(
        `${source.label}: ${result.fetched ?? 0} kayıt okundu, ${result.added ?? 0} yeni aday`,
      );
      router.refresh();
    });
  }

  async function removeEvents(source: EventSource) {
    const ok = await confirm({
      title: "Alınan etkinlikleri sil",
      description: (
        <>
          <strong>{source.label}</strong> kaynağından takvime alınmış
          etkinlikler silinir. Adaylar listede kalır, yeniden alabilirsiniz.
        </>
      ),
      confirmLabel: "Sil",
    });
    if (!ok) return;
    startTransition(async () => {
      const result = await deleteSourceEvents(source.id);
      if (result.error) {
        toast.error(result.error);
        return;
      }
      toast.success(`${result.removed ?? 0} etkinlik silindi`);
      router.refresh();
    });
  }

  async function remove(source: EventSource) {
    const ok = await confirm({
      title: "Kaynağı sil",
      description: (
        <>
          <strong>{source.label}</strong> kaynağı ve bu kaynaktan gelen adaylar
          silinir. Takvime alınmış etkinlikler kalır.
        </>
      ),
      confirmLabel: "Sil",
    });
    if (!ok) return;
    startTransition(async () => {
      const result = await deleteEventSource(source.id);
      if (result.error) {
        toast.error(result.error);
        return;
      }
      toast.success("Kaynak silindi");
      router.refresh();
    });
  }

  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_22rem]">
      <section className="bento overflow-hidden">
        <h2 className="border-b border-border/60 bg-muted/40 px-4 py-2.5 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
          Kaynaklar
          <span className="ml-2 normal-case opacity-70">
            {sources.length} kaynak
          </span>
        </h2>
        {sources.length === 0 ? (
          <p className="px-4 py-6 text-sm text-muted-foreground">
            Henüz kaynak yok. Sağdaki formdan bir takvim (ICS) adresi ekleyin.
          </p>
        ) : (
          <ul>
            {sources.map((source) => (
              <li
                key={source.id}
                className="flex flex-wrap items-center gap-x-4 gap-y-2 border-b border-border/50 px-4 py-3 last:border-b-0"
              >
                <div className="min-w-0 flex-1">
                  <p className="flex flex-wrap items-center gap-2 font-medium">
                    {source.label}
                    <span className="rounded-full bg-muted px-1.5 py-0.5 text-[10px] uppercase text-muted-foreground">
                      {source.kind}
                    </span>
                    <span className="rounded-full bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">
                      {source.default_status === "bilgi"
                        ? "bilgi olarak alınır"
                        : "aday olarak alınır"}
                    </span>
                  </p>
                  <p className="mt-0.5 truncate text-xs text-muted-foreground">
                    {source.url}
                  </p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {source.last_error ? (
                      <span
                        className="inline-flex items-center gap-1"
                        style={{ color: "var(--accent-rose)" }}
                      >
                        <TriangleAlert className="size-3" />
                        {source.last_error}
                      </span>
                    ) : source.last_synced_at ? (
                      `Son tarama: ${source.last_synced_at.slice(0, 16).replace("T", " ")}`
                    ) : (
                      "Henüz taranmadı"
                    )}
                    {` · ${candidateCounts[source.id] ?? 0} aday`}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => sync(source)}
                  disabled={pending}
                  className="press inline-flex items-center gap-1.5 rounded-lg bg-primary/10 px-2.5 py-1.5 text-sm font-medium text-primary transition-colors hover:bg-primary/20 disabled:opacity-40"
                >
                  <RefreshCw className="size-3.5" />
                  Şimdi tara
                </button>
                <button
                  type="button"
                  onClick={() => removeEvents(source)}
                  disabled={pending}
                  aria-label={`${source.label} kaynağından alınan etkinlikleri sil`}
                  title="Bu kaynaktan takvime alınmış etkinlikleri sil"
                  className="press grid size-8 place-items-center rounded-lg text-muted-foreground transition-colors hover:bg-accent hover:text-foreground disabled:opacity-40"
                >
                  <CalendarX className="size-4" />
                </button>
                <button
                  type="button"
                  onClick={() => remove(source)}
                  disabled={pending}
                  aria-label={`${source.label} kaynağını sil`}
                  className="press grid size-8 place-items-center rounded-lg text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive disabled:opacity-40"
                >
                  <Trash2 className="size-4" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="bento h-fit p-5">
        <h2 className="mb-1 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
          Yeni kaynak
        </h2>
        <p className="mb-4 text-xs text-muted-foreground">
          Taranan etkinlikler doğrudan takvime yazılmaz; Radar sekmesinde aday
          olarak listelenir.
        </p>
        <form ref={formRef} action={formAction} className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="label">Ad</Label>
            <Input
              id="label"
              name="label"
              required
              maxLength={120}
              placeholder="Örn. APIdays takvimi"
              className="h-10 rounded-xl px-3"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="kind">Tür</Label>
            <Select id="kind" name="kind" defaultValue="ics">
              <option value="ics">ICS takvim akışı</option>
              <option value="json">JSON listesi</option>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="default_status">Takvime alınınca</Label>
            <Select id="default_status" name="default_status" defaultValue="aday">
              <option value="aday">Aday olsun (karar bekler)</option>
              <option value="bilgi">Bilgi olsun (karar gerektirmez)</option>
            </Select>
            <p className="text-xs text-muted-foreground">
              Resmi tatil, bayram veya ekip takvimi gibi kaynaklarda
              &quot;Bilgi&quot; seçin; bu kayıtlar &quot;Karar bekliyor&quot;
              listesine düşmez.
            </p>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="url">Adres</Label>
            <Input
              id="url"
              name="url"
              required
              placeholder="https://..."
              className="h-10 rounded-xl px-3"
            />
            <p className="text-xs text-muted-foreground">
              Yalnızca https adresleri kabul edilir.
            </p>
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
            {saving ? "Ekleniyor..." : "Kaynak ekle"}
          </Button>
        </form>
      </section>
    </div>
  );
}
