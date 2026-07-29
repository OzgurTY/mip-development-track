"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronLeft, Save } from "lucide-react";
import { toast } from "sonner";
import { PocForm } from "../poc-form";
import { PocPreview } from "../poc-preview";
import { PocExport } from "../poc-export";
import { PocDeleteButton } from "../poc-delete";
import { savePoc } from "@/lib/poc/actions";
import { toDraft } from "@/lib/poc/draft";
import type { PocDraft } from "@/lib/poc/schema";
import type { PocRecord } from "@/lib/poc/types";
import { Button } from "@/components/ui/button";

type Props = {
  record: PocRecord;
  canEdit: boolean;
  customerOptions: string[];
};

type View = "split" | "form" | "preview";

export function PocEditor({ record, canEdit, customerOptions }: Props) {
  const router = useRouter();
  const initial = useMemo(() => toDraft(record), [record]);
  const [draft, setDraft] = useState<PocDraft>(initial);
  const [saved, setSaved] = useState(() => JSON.stringify(initial));
  const [saving, setSaving] = useState(false);
  const [view, setView] = useState<View>("split");

  const isDirty = JSON.stringify(draft) !== saved;

  // Kaydetme, klavye kisayolu ve disa aktarma ayni guncel taslagi okur.
  const draftRef = useRef(draft);
  useEffect(() => {
    draftRef.current = draft;
  }, [draft]);

  const patch = useCallback((values: Partial<PocDraft>) => {
    setDraft((current) => ({ ...current, ...values }));
  }, []);

  const save = useCallback(async (): Promise<boolean> => {
    if (!canEdit) return false;
    const snapshot = JSON.stringify(draftRef.current);
    setSaving(true);
    const result = await savePoc(record.id, draftRef.current);
    setSaving(false);
    if (result.error) {
      toast.error(result.error);
      return false;
    }
    setSaved(snapshot);
    toast.success("Kaydedildi");
    router.refresh();
    return true;
  }, [canEdit, record.id, router]);

  // Cmd/Ctrl+S ile kaydet.
  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "s") {
        event.preventDefault();
        if (canEdit) void save();
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [canEdit, save]);

  // Kaydedilmemis degisiklikle sayfadan ayrilmayi uyar.
  useEffect(() => {
    if (!isDirty) return;
    function onBeforeUnload(event: BeforeUnloadEvent) {
      event.preventDefault();
    }
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [isDirty]);

  return (
    <div className="space-y-5">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <Link
            href="/poc"
            className="press inline-flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            <ChevronLeft className="size-4" />
            PoC listesi
          </Link>
          <h1 className="mt-1 truncate font-display text-2xl font-bold tracking-tight sm:text-3xl">
            {draft.customer_name || "Firma adı girilmedi"}
          </h1>
          <p className="mt-0.5 truncate text-sm text-muted-foreground">
            {draft.title || "Başlıksız PoC"}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <ViewToggle view={view} onChange={setView} />
          {canEdit && (
            <>
              <SaveState isDirty={isDirty} saving={saving} />
              <Button
                type="button"
                size="lg"
                className="press h-10 gap-2"
                onClick={() => void save()}
                disabled={saving || !isDirty}
              >
                <Save className="size-4" />
                Kaydet
              </Button>
            </>
          )}
          <PocExport id={record.id} isDirty={isDirty} onSave={save} />
          {canEdit && (
            <PocDeleteButton
              id={record.id}
              label={`${record.customer_name} - ${record.title}`}
              redirectTo="/poc"
            />
          )}
        </div>
      </header>

      <div className="grid gap-6 xl:grid-cols-2">
        <div className={view === "preview" ? "hidden xl:block" : "block"}>
          <PocForm
            draft={draft}
            onPatch={patch}
            disabled={!canEdit}
            customerOptions={customerOptions}
          />
        </div>

        <div className={view === "form" ? "hidden xl:block" : "block"}>
          <div className="xl:sticky xl:top-6">
            <div className="mb-2 flex items-center justify-between px-1">
              <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                Canlı önizleme
              </p>
              <p className="text-xs text-muted-foreground">
                Çıktının birebir görünümü
              </p>
            </div>
            <div className="overflow-x-auto rounded-2xl bg-muted/40 p-3 ring-1 ring-foreground/[0.06] sm:p-4 xl:max-h-[calc(100dvh-9rem)] xl:overflow-auto">
              <PocPreview draft={draft} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function SaveState({ isDirty, saving }: { isDirty: boolean; saving: boolean }) {
  if (saving) {
    return <span className="text-sm text-muted-foreground">Kaydediliyor...</span>;
  }
  if (!isDirty) {
    return <span className="text-sm text-muted-foreground">Kaydedildi</span>;
  }
  return (
    <span className="inline-flex items-center gap-1.5 text-sm text-muted-foreground">
      <span className="size-1.5 rounded-full bg-[var(--accent-amber)]" />
      Kaydedilmedi
    </span>
  );
}

function ViewToggle({
  view,
  onChange,
}: {
  view: View;
  onChange: (view: View) => void;
}) {
  return (
    <div className="inline-flex items-center gap-1 rounded-xl bg-muted/60 p-1 ring-1 ring-foreground/[0.05] xl:hidden">
      <ToggleButton
        active={view !== "preview"}
        onClick={() => onChange("form")}
      >
        Düzenle
      </ToggleButton>
      <ToggleButton
        active={view === "preview"}
        onClick={() => onChange("preview")}
      >
        Önizleme
      </ToggleButton>
    </div>
  );
}

function ToggleButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={
        active
          ? "press rounded-lg bg-card px-2.5 py-1 text-sm font-medium shadow-sm ring-1 ring-foreground/[0.06]"
          : "press rounded-lg px-2.5 py-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
      }
    >
      {children}
    </button>
  );
}
