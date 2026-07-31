"use client";

import Link from "next/link";
import { CalendarClock, CircleHelp, ListChecks, TriangleAlert } from "lucide-react";
import { daysUntil, formatRangeTr } from "@/lib/calendar/date";
import { tint } from "@/components/status-badge";
import { eventHref, type CalendarEvent } from "@/lib/events/expand";
import {
  formatAmount,
  totalByCurrency,
  type EventTask,
} from "@/lib/events/planning";
import {
  eventEnd,
  locationLabel,
  PARTICIPATION_LABEL,
  PENDING_STATUSES,
  STATUS_LABEL,
  type Participation,
} from "@/lib/events/types";

const UPCOMING_WINDOW_DAYS = 60;
const LIST_LIMIT = 5;

type Props = {
  events: CalendarEvent[];
  today: string;
};

export function SidePanels({ events, today }: Props) {
  const upcoming = events
    .filter((event) => {
      if (eventEnd(event) < today) return false;
      if (event.status === "iptal") return false;
      return daysUntil(event.start_date, today) <= UPCOMING_WINDOW_DAYS;
    })
    .sort((a, b) => a.start_date.localeCompare(b.start_date))
    .slice(0, LIST_LIMIT);

  const pending = events
    .filter(
      (event) =>
        PENDING_STATUSES.includes(event.status) && eventEnd(event) >= today,
    )
    .sort((a, b) => {
      const aKey = a.deadline_date ?? a.start_date;
      const bKey = b.deadline_date ?? b.start_date;
      return aKey.localeCompare(bKey);
    })
    .slice(0, LIST_LIMIT);

  // Gorev ve maliyet seriye aittir: tekrar ornekleri once tekillestirilir.
  const uniqueEvents = [...new Map(events.map((e) => [e.id, e])).values()];
  const openTasks = uniqueEvents
    .flatMap((event) =>
      event.tasks
        .filter((task) => task.status !== "Tamamlandı" && task.title.trim())
        .map((task) => ({ task, event })),
    )
    .sort((a, b) => taskKey(a.task).localeCompare(taskKey(b.task)))
    .slice(0, LIST_LIMIT);

  const quarter = quarterSummary(uniqueEvents, today);

  return (
    <div className="space-y-4">
      <Panel icon={CalendarClock} title="Yaklaşanlar" hint="60 gün">
        {upcoming.length === 0 ? (
          <Empty>Yaklaşan etkinlik yok.</Empty>
        ) : (
          <ul className="space-y-2.5">
            {upcoming.map((event) => (
              <li key={event.occurrenceKey}>
                <Link
                  href={eventHref(event)}
                  className="group flex flex-col gap-0.5"
                >
                  <span className="flex items-center gap-2">
                    <span
                      className="size-2 shrink-0 rounded-full"
                      style={{ background: event.typeColor }}
                    />
                    <span className="truncate text-sm font-medium group-hover:text-primary">
                      {event.title}
                    </span>
                  </span>
                  <span className="pl-4 text-xs text-muted-foreground">
                    {formatRangeTr(event.start_date, event.end_date)}
                    {locationLabel(event) ? ` · ${locationLabel(event)}` : ""}
                    {event.participation
                      ? ` · ${PARTICIPATION_LABEL[event.participation as Participation] ?? event.participation}`
                      : ""}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </Panel>

      <Panel icon={CircleHelp} title="Karar bekliyor">
        {pending.length === 0 ? (
          <Empty>Karar bekleyen etkinlik yok.</Empty>
        ) : (
          <ul className="space-y-2.5">
            {pending.map((event) => {
              const left = event.deadline_date
                ? daysUntil(event.deadline_date, today)
                : null;
              const urgent = left !== null && left <= 14;
              return (
                <li key={event.occurrenceKey}>
                  <Link
                    href={eventHref(event)}
                    className="group flex flex-col gap-0.5"
                  >
                    <span className="flex items-center gap-2">
                      {urgent ? (
                        <TriangleAlert
                          className="size-3.5 shrink-0"
                          style={{ color: "var(--accent-amber)" }}
                        />
                      ) : (
                        <span className="size-2 shrink-0 rounded-full bg-muted-foreground/40" />
                      )}
                      <span className="truncate text-sm font-medium group-hover:text-primary">
                        {event.title}
                      </span>
                    </span>
                    <span className="pl-5.5 text-xs text-muted-foreground">
                      {STATUS_LABEL[event.status]}
                      {left === null
                        ? ""
                        : left >= 0
                          ? ` · son başvuruya ${left} gün`
                          : " · son başvuru geçti"}
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </Panel>

      {openTasks.length > 0 ? (
        <Panel icon={ListChecks} title="Açık görevler">
          <ul className="space-y-2.5">
            {openTasks.map(({ task, event }) => {
              const left = task.due_date ? daysUntil(task.due_date, today) : null;
              return (
                <li key={`${event.id}-${task.title}`}>
                  <Link
                    href={`/takvim/${event.id}`}
                    className="group flex flex-col gap-0.5"
                  >
                    <span className="truncate text-sm font-medium group-hover:text-primary">
                      {task.title}
                    </span>
                    <span className="truncate text-xs text-muted-foreground">
                      {event.title}
                      {left === null
                        ? ""
                        : left >= 0
                          ? ` · ${left} gün kaldı`
                          : ` · ${Math.abs(left)} gün gecikti`}
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </Panel>
      ) : null}

      <Panel icon={CalendarClock} title={`${quarter.label} özeti`}>
        <div className="grid grid-cols-3 gap-2 text-center">
          <Metric value={quarter.total} label="etkinlik" />
          <Metric value={quarter.sponsor} label="sponsorluk" />
          <Metric value={quarter.pending} label="karar bekliyor" />
        </div>
        {quarter.budget.length > 0 ? (
          <p className="mt-3 border-t border-border/60 pt-2 text-sm">
            <span className="text-muted-foreground">Bütçe: </span>
            {quarter.budget
              .map((total) => formatAmount(total.total, total.currency))
              .join(" · ")}
          </p>
        ) : null}
      </Panel>
    </div>
  );
}

function quarterSummary(events: CalendarEvent[], today: string) {
  const year = Number(today.slice(0, 4));
  const month = Number(today.slice(5, 7));
  const quarterIndex = Math.floor((month - 1) / 3);
  const startMonth = quarterIndex * 3 + 1;
  const start = `${year}-${String(startMonth).padStart(2, "0")}-01`;
  const endMonth = startMonth + 2;
  const end = `${year}-${String(endMonth).padStart(2, "0")}-31`;

  // Bilgi kayitlari (tatil vb.) bizim etkinligimiz degil, sayilmaz.
  const inQuarter = events.filter(
    (event) =>
      event.status !== "bilgi" &&
      event.start_date >= start &&
      event.start_date <= end,
  );
  return {
    label: `${year} Ç${quarterIndex + 1}`,
    budget: totalByCurrency(inQuarter.flatMap((event) => event.costs)),
    total: inQuarter.length,
    sponsor: inQuarter.filter(
      (event) => event.participation === "sponsor" || event.participation === "stand",
    ).length,
    pending: inQuarter.filter((event) => PENDING_STATUSES.includes(event.status))
      .length,
  };
}

/** Tarihsiz gorevler listenin sonuna dussun. */
function taskKey(task: EventTask): string {
  return task.due_date || "9999-12-31";
}

function Panel({
  icon: Icon,
  title,
  hint,
  children,
}: {
  icon: typeof CalendarClock;
  title: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="bento p-4">
      <header className="mb-3 flex items-center gap-2">
        <span
          className="grid size-7 place-items-center rounded-xl"
          style={tint("var(--accent-indigo)")}
        >
          <Icon className="size-3.5 text-primary" />
        </span>
        <h2 className="text-sm font-semibold tracking-tight">{title}</h2>
        {hint ? (
          <span className="ml-auto text-xs text-muted-foreground">{hint}</span>
        ) : null}
      </header>
      {children}
    </section>
  );
}

function Empty({ children }: { children: React.ReactNode }) {
  return <p className="text-sm text-muted-foreground">{children}</p>;
}

function Metric({ value, label }: { value: number; label: string }) {
  return (
    <div className="rounded-xl bg-muted/50 py-2">
      <p className="font-display text-xl font-bold tabular-nums">{value}</p>
      <p className="text-[11px] text-muted-foreground">{label}</p>
    </div>
  );
}
