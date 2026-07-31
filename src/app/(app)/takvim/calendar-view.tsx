"use client";

import { useMemo, useState } from "react";
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Download,
  Plus,
} from "lucide-react";
import { MonthGrid } from "./month-grid";
import { AgendaList } from "./agenda-list";
import { SidePanels } from "./side-panels";
import { RadarList } from "./radar-list";
import { EventDialog } from "./event-dialog";
import { addMonths, monthLabel, todayIso } from "@/lib/calendar/date";
import { expandEvents, viewWindow } from "@/lib/events/expand";
import { eventEnd, PENDING_STATUSES, type EventItem, type EventType } from "@/lib/events/types";
import { PageHeader } from "@/components/page-header";
import type { EventCandidate } from "@/lib/events/source-types";
import { SearchInput } from "@/components/search-input";
import { Button } from "@/components/ui/button";
import { tint } from "@/components/status-badge";

type View = "ay" | "ajanda" | "radar";

type Props = {
  events: EventItem[];
  types: EventType[];
  customers: { id: string; name: string }[];
  owners: { id: string; name: string }[];
  canEdit: boolean;
  initialView: View;
  candidates: EventCandidate[];
};

/**
 * Tek sayfada iki gorunum. Tum etkinlikler sunucudan bir kez gelir; ay
 * gezinmesi ve filtreleme istemcide yapilir, her tikta sunucuya gidilmez.
 */
export function CalendarView({
  events,
  types,
  customers,
  owners,
  canEdit,
  initialView,
  candidates,
}: Props) {
  const today = todayIso();
  const [view, setView] = useState<View>(initialView);
  const [cursor, setCursor] = useState(() => ({
    year: Number(today.slice(0, 4)),
    monthIndex: Number(today.slice(5, 7)) - 1,
  }));
  const [activeTypes, setActiveTypes] = useState<string[]>([]);
  const [query, setQuery] = useState("");
  const [showPast, setShowPast] = useState(false);
  const [dialog, setDialog] = useState<{
    open: boolean;
    event?: EventItem | null;
    date?: string;
  }>({ open: false });

  function changeView(next: View) {
    setView(next);
    // Baglanti paylasilabilsin diye adres cubugunu guncelle, sayfayi yeniden
    // yukletmeden (veri zaten istemcide).
    if (typeof window !== "undefined") {
      const url = new URL(window.location.href);
      url.searchParams.set("g", next);
      window.history.replaceState(null, "", url);
    }
  }

  // Tekrarlayan seriler burada ornege ayrilir; pencere gezilen ay ile bugunu
  // birlikte kapsar.
  const expanded = useMemo(
    () => expandEvents(events, viewWindow(today, cursor)),
    [events, today, cursor],
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLocaleLowerCase("tr");
    return expanded.filter((event) => {
      if (activeTypes.length > 0 && !activeTypes.includes(event.type ?? "")) {
        return false;
      }
      if (!q) return true;
      return (
        event.title.toLocaleLowerCase("tr").includes(q) ||
        (event.city ?? "").toLocaleLowerCase("tr").includes(q) ||
        (event.country ?? "").toLocaleLowerCase("tr").includes(q) ||
        (event.customerName ?? "").toLocaleLowerCase("tr").includes(q)
      );
    });
  }, [expanded, activeTypes, query]);

  const agendaEvents = useMemo(
    () => (showPast ? filtered : filtered.filter((e) => eventEnd(e) >= today)),
    [filtered, showPast, today],
  );

  const monthEvents = useMemo(() => {
    const prefix = `${cursor.year}-${String(cursor.monthIndex + 1).padStart(2, "0")}`;
    return filtered.filter((event) => {
      // Aya degen her etkinlik: ay icinde baslayan, biten veya ayi kapsayan.
      const end = eventEnd(event);
      return event.start_date.slice(0, 7) <= prefix && end.slice(0, 7) >= prefix;
    });
  }, [filtered, cursor]);

  const pendingCount = events.filter((e) =>
    PENDING_STATUSES.includes(e.status),
  ).length;
  const newCandidates = candidates.filter((c) => c.status === "yeni").length;

  function shift(delta: number) {
    setCursor((current) => addMonths(current.year, current.monthIndex, delta));
  }

  function goToday() {
    setCursor({
      year: Number(today.slice(0, 4)),
      monthIndex: Number(today.slice(5, 7)) - 1,
    });
  }

  return (
    <div className="space-y-5">
      <PageHeader
        title="Takvim"
        subtitle={`${events.length} etkinlik, ${pendingCount} karar bekliyor`}
      >
        <div className="inline-flex items-center gap-1 rounded-xl bg-muted/60 p-1 ring-1 ring-foreground/[0.05]">
          <ViewButton active={view === "ay"} onClick={() => changeView("ay")}>
            Ay
          </ViewButton>
          <ViewButton
            active={view === "ajanda"}
            onClick={() => changeView("ajanda")}
          >
            Ajanda
          </ViewButton>
          <ViewButton
            active={view === "radar"}
            onClick={() => changeView("radar")}
          >
            Radar
            {newCandidates > 0 ? (
              <span className="ml-1 rounded-full bg-primary px-1.5 text-[10px] font-semibold text-primary-foreground">
                {newCandidates}
              </span>
            ) : null}
          </ViewButton>
        </div>
        <a
          href="/api/takvim/ics"
          download
          title="Takvimi Outlook veya Google Takvim'e aktar"
          className="press inline-flex h-10 items-center gap-1.5 rounded-lg bg-card px-3 text-sm font-medium ring-1 ring-foreground/[0.08] transition-colors hover:bg-accent"
        >
          <Download className="size-3.5" />
          ICS
        </a>
        {canEdit ? (
          <Button
            size="lg"
            className="press h-10 gap-2"
            onClick={() => setDialog({ open: true, event: null })}
          >
            <Plus className="size-4" />
            Yeni etkinlik
          </Button>
        ) : null}
      </PageHeader>

      {view === "radar" ? (
        <RadarList candidates={candidates} canEdit={canEdit} />
      ) : (
      <>
      <div className="flex flex-wrap items-center gap-2">
        {view === "ay" ? (
          <div className="hidden items-center gap-1.5 md:flex">
            <button
              type="button"
              onClick={() => shift(-1)}
              aria-label="Önceki ay"
              className="press grid size-9 place-items-center rounded-xl bg-card ring-1 ring-foreground/[0.08] transition-colors hover:bg-accent"
            >
              <ChevronLeft className="size-4" />
            </button>
            <button
              type="button"
              onClick={goToday}
              className="press rounded-xl bg-card px-3 py-2 text-sm font-medium ring-1 ring-foreground/[0.08] transition-colors hover:bg-accent"
            >
              Bugün
            </button>
            <button
              type="button"
              onClick={() => shift(1)}
              aria-label="Sonraki ay"
              className="press grid size-9 place-items-center rounded-xl bg-card ring-1 ring-foreground/[0.08] transition-colors hover:bg-accent"
            >
              <ChevronRight className="size-4" />
            </button>
            <span className="ml-1 font-display text-lg font-semibold">
              {monthLabel(cursor.year, cursor.monthIndex)}
            </span>
          </div>
        ) : (
          <SearchInput
            value={query}
            onChange={setQuery}
            placeholder="Etkinlik, şehir, müşteri ara..."
            className="w-full max-w-xs"
          />
        )}

        <div className="flex flex-wrap gap-1.5 md:ml-auto">
          <Chip
            active={activeTypes.length === 0}
            onClick={() => setActiveTypes([])}
          >
            Tümü
          </Chip>
          {types.map((type) => {
            const active = activeTypes.includes(type.key);
            return (
              <Chip
                key={type.key}
                active={active}
                color={type.color}
                onClick={() =>
                  setActiveTypes((current) =>
                    current.includes(type.key)
                      ? current.filter((k) => k !== type.key)
                      : [...current, type.key],
                  )
                }
              >
                {type.label}
              </Chip>
            );
          })}
        </div>
      </div>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_20rem]">
        <div className="min-w-0 space-y-4">
          {view === "ay" ? (
            <>
              <div className="hidden md:block">
                <MonthGrid
                  year={cursor.year}
                  monthIndex={cursor.monthIndex}
                  today={today}
                  events={monthEvents}
                  onDayClick={
                    canEdit
                      ? (iso) => setDialog({ open: true, event: null, date: iso })
                      : undefined
                  }
                />
              </div>
              {/* Telefonda 7 kolonlu izgara okunmaz: ajanda gosterilir. */}
              <div className="md:hidden">
                <AgendaList events={agendaEvents} today={today} />
              </div>
            </>
          ) : (
            <>
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm text-muted-foreground">
                  {agendaEvents.length} etkinlik
                </p>
                <Chip active={showPast} onClick={() => setShowPast((v) => !v)}>
                  Geçmişi göster
                </Chip>
              </div>
              <AgendaList events={agendaEvents} today={today} />
            </>
          )}
        </div>

        <SidePanels events={filtered} today={today} />
      </div>
      </>
      )}

      {canEdit ? (
        <EventDialog
          open={dialog.open}
          onOpenChange={(open) =>
            setDialog((current) => ({ ...current, open }))
          }
          event={dialog.event}
          initialDate={dialog.date}
          types={types}
          customers={customers}
          owners={owners}
        />
      ) : null}

      {events.length === 0 ? (
        <p className="flex items-center gap-2 text-sm text-muted-foreground">
          <CalendarDays className="size-4" />
          Henüz etkinlik yok. Takvimde bir güne tıklayarak da ekleyebilirsiniz.
        </p>
      ) : null}
    </div>
  );
}

function ViewButton({
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

function Chip({
  active,
  color,
  onClick,
  children,
}: {
  active: boolean;
  color?: string;
  onClick: () => void;
  children: React.ReactNode;
}) {
  if (active && color) {
    return (
      <button
        type="button"
        onClick={onClick}
        aria-pressed
        className="press inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium"
        style={tint(color)}
      >
        <span className="size-1.5 rounded-full" style={{ background: color }} />
        {children}
      </button>
    );
  }
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={
        active
          ? "press inline-flex items-center gap-1.5 rounded-full bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground"
          : "press inline-flex items-center gap-1.5 rounded-full bg-card px-3 py-1.5 text-sm text-muted-foreground ring-1 ring-foreground/[0.08] transition-colors hover:text-foreground"
      }
    >
      {color ? (
        <span className="size-1.5 rounded-full" style={{ background: color }} />
      ) : null}
      {children}
    </button>
  );
}
