"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Check,
  ExternalLink,
  EyeOff,
  Info,
  Plus,
  Radar,
  RotateCcw,
} from "lucide-react";
import { toast } from "sonner";
import {
  promoteCandidate,
  promoteCandidates,
  setCandidateStatus,
  setCandidateStatuses,
} from "@/lib/events/source-actions";
import type { EventCandidate } from "@/lib/events/source-types";
import { formatRangeTr } from "@/lib/calendar/date";
import { useConfirm } from "@/components/ui/confirm-dialog";
import { EmptyState } from "@/components/empty-state";
import { SearchInput } from "@/components/search-input";

type Props = {
  candidates: EventCandidate[];
  canEdit: boolean;
};

/**
 * Dis kaynaklardan gelen aday etkinlikler. Takvime yalnizca insan onayi ile
 * gecerler; secim kutulariyla toplu alma ve gizleme yapilabilir.
 */
export function RadarList({ candidates, canEdit }: Props) {
  const router = useRouter();
  const confirm = useConfirm();
  const [query, setQuery] = useState("");
  const [showHidden, setShowHidden] = useState(false);
  const [selected, setSelected] = useState<string[]>([]);
  const [pending, startTransition] = useTransition();

  const filtered = useMemo(() => {
    const q = query.trim().toLocaleLowerCase("tr");
    return candidates.filter((candidate) => {
      if (showHidden ? candidate.status === "yeni" : candidate.status !== "yeni") {
        return false;
      }
      if (!q) return true;
      return (
        candidate.title.toLocaleLowerCase("tr").includes(q) ||
        (candidate.city ?? "").toLocaleLowerCase("tr").includes(q) ||
        (candidate.country ?? "").toLocaleLowerCase("tr").includes(q)
      );
    });
  }, [candidates, query, showHidden]);

  // Takvime alinmis adaylar secilemez.
  const selectable = filtered.filter((c) => c.status !== "takvime_alindi");
  const selectedHere = selected.filter((id) =>
    selectable.some((candidate) => candidate.id === id),
  );
  const allSelected =
    selectable.length > 0 && selectedHere.length === selectable.length;

  function toggle(id: string) {
    setSelected((current) =>
      current.includes(id)
        ? current.filter((value) => value !== id)
        : [...current, id],
    );
  }

  function toggleAll() {
    setSelected(allSelected ? [] : selectable.map((candidate) => candidate.id));
  }

  async function bulkPromote(status?: "aday" | "bilgi") {
    if (selectedHere.length > 20) {
      const ok = await confirm({
        title: "Takvime al",
        description: `${selectedHere.length} aday takvime alınacak. Hepsi "${
          status === "bilgi" ? "Bilgi" : "Aday"
        }" durumunda oluşur.`,
        confirmLabel: "Takvime al",
        danger: false,
      });
      if (!ok) return;
    }
    startTransition(async () => {
      const result = await promoteCandidates(selectedHere, status);
      if (result.error) {
        toast.error(result.error);
        return;
      }
      toast.success(`${result.added ?? 0} etkinlik takvime alındı`);
      setSelected([]);
      router.refresh();
    });
  }

  function bulkStatus(status: "yeni" | "gizlendi") {
    startTransition(async () => {
      const result = await setCandidateStatuses(selectedHere, status);
      if (result.error) {
        toast.error(result.error);
        return;
      }
      setSelected([]);
      router.refresh();
    });
  }

  function promote(candidate: EventCandidate) {
    startTransition(async () => {
      const result = await promoteCandidate(candidate.id);
      if (result.error) {
        toast.error(result.error);
        return;
      }
      toast.success("Takvime alındı");
      if (result.eventId) router.push(`/takvim/${result.eventId}`);
    });
  }

  function changeStatus(candidate: EventCandidate, status: "yeni" | "gizlendi") {
    startTransition(async () => {
      const result = await setCandidateStatus(candidate.id, status);
      if (result.error) {
        toast.error(result.error);
        return;
      }
      router.refresh();
    });
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <SearchInput
          value={query}
          onChange={setQuery}
          placeholder="Aday etkinlik ara..."
          className="w-full max-w-xs"
        />
        <button
          type="button"
          onClick={() => {
            setShowHidden((v) => !v);
            setSelected([]);
          }}
          aria-pressed={showHidden}
          className={
            showHidden
              ? "press rounded-full bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground"
              : "press rounded-full bg-card px-3 py-1.5 text-sm text-muted-foreground ring-1 ring-foreground/[0.08] transition-colors hover:text-foreground"
          }
        >
          {showHidden ? "Gizlenen ve alınanlar" : "Yeni adaylar"}
        </button>
        <p className="text-sm text-muted-foreground">{filtered.length} aday</p>
      </div>

      {canEdit && selectable.length > 0 ? (
        <div className="flex flex-wrap items-center gap-2 rounded-2xl bg-muted/50 px-3 py-2 ring-1 ring-foreground/[0.05]">
          <button
            type="button"
            onClick={toggleAll}
            className="press inline-flex items-center gap-2 rounded-lg px-2 py-1 text-sm font-medium transition-colors hover:bg-accent"
          >
            <Box checked={allSelected} />
            {allSelected ? "Seçimi temizle" : "Tümünü seç"}
          </button>
          <span className="text-sm text-muted-foreground">
            {selectedHere.length} seçili
          </span>
          {selectedHere.length > 0 ? (
            <div className="ml-auto flex flex-wrap items-center gap-1.5">
              {showHidden ? (
                <button
                  type="button"
                  onClick={() => bulkStatus("yeni")}
                  disabled={pending}
                  className="press inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-foreground disabled:opacity-40"
                >
                  <RotateCcw className="size-3.5" />
                  Geri al
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => bulkStatus("gizlendi")}
                  disabled={pending}
                  className="press inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-foreground disabled:opacity-40"
                >
                  <EyeOff className="size-3.5" />
                  Gizle
                </button>
              )}
              <button
                type="button"
                onClick={() => bulkPromote("bilgi")}
                disabled={pending}
                title="Karar gerektirmeyen kayıtlar için (tatil, bilgi amaçlı)"
                className="press inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-foreground disabled:opacity-40"
              >
                <Info className="size-3.5" />
                Bilgi olarak al
              </button>
              <button
                type="button"
                onClick={() => bulkPromote()}
                disabled={pending}
                className="press inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-40"
              >
                <Plus className="size-3.5" />
                {pending
                  ? "Alınıyor..."
                  : `${selectedHere.length} etkinliği takvime al`}
              </button>
            </div>
          ) : null}
        </div>
      ) : null}

      {filtered.length === 0 ? (
        <div className="bento">
          <EmptyState
            icon={Radar}
            title={candidates.length === 0 ? "Henüz aday yok" : "Eşleşen aday yok"}
            description={
              candidates.length === 0
                ? "Yönetim > Etkinlik kaynakları bölümünden bir takvim kaynağı ekleyip tarama yapın."
                : "Aramayı değiştirin veya diğer listeye geçin."
            }
          />
        </div>
      ) : (
        <ul className="space-y-2">
          {filtered.map((candidate) => {
            const isSelected = selected.includes(candidate.id);
            const taken = candidate.status === "takvime_alindi";
            return (
              <li
                key={candidate.id}
                className={
                  isSelected
                    ? "bento flex flex-wrap items-center gap-x-4 gap-y-2 p-4 ring-2 ring-primary/40"
                    : "bento flex flex-wrap items-center gap-x-4 gap-y-2 p-4"
                }
              >
                {canEdit && !taken ? (
                  <button
                    type="button"
                    onClick={() => toggle(candidate.id)}
                    aria-pressed={isSelected}
                    aria-label={`${candidate.title} seç`}
                    className="press shrink-0"
                  >
                    <Box checked={isSelected} />
                  </button>
                ) : null}

                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">{candidate.title}</p>
                  <p className="mt-0.5 truncate text-xs text-muted-foreground">
                    {candidate.start_date
                      ? formatRangeTr(candidate.start_date, candidate.end_date)
                      : "Tarih yok"}
                    {candidate.city ? ` · ${candidate.city}` : ""}
                    {candidate.country ? `, ${candidate.country}` : ""}
                    {` · ${candidate.sourceLabel}`}
                  </p>
                </div>

                {candidate.url ? (
                  <a
                    href={candidate.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="press inline-flex items-center gap-1 text-xs text-muted-foreground underline-offset-4 hover:text-primary hover:underline"
                  >
                    <ExternalLink className="size-3.5" />
                    Site
                  </a>
                ) : null}

                {taken ? (
                  <span className="text-xs text-muted-foreground">
                    Takvime alındı
                  </span>
                ) : canEdit ? (
                  <div className="flex items-center gap-1.5">
                    {candidate.status === "gizlendi" ? (
                      <button
                        type="button"
                        onClick={() => changeStatus(candidate, "yeni")}
                        disabled={pending}
                        className="press inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-foreground disabled:opacity-40"
                      >
                        <RotateCcw className="size-3.5" />
                        Geri al
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => changeStatus(candidate, "gizlendi")}
                        disabled={pending}
                        className="press inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-foreground disabled:opacity-40"
                      >
                        <EyeOff className="size-3.5" />
                        Gizle
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => promote(candidate)}
                      disabled={pending}
                      className="press inline-flex items-center gap-1.5 rounded-lg bg-primary/10 px-2.5 py-1.5 text-sm font-medium text-primary transition-colors hover:bg-primary/20 disabled:opacity-40"
                    >
                      <Plus className="size-3.5" />
                      Takvime al
                    </button>
                  </div>
                ) : null}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

function Box({ checked }: { checked: boolean }) {
  return (
    <span
      className={
        checked
          ? "grid size-4 shrink-0 place-items-center rounded border border-primary bg-primary text-primary-foreground"
          : "grid size-4 shrink-0 place-items-center rounded border border-input"
      }
    >
      {checked ? <Check className="size-3" /> : null}
    </span>
  );
}
