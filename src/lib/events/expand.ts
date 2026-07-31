import { expandOccurrences } from "@/lib/calendar/recurrence";
import { recurrenceOf, type EventItem } from "./types";

/**
 * Takvimde gosterilen tek bir olay. Tekrarlayan seriler okuma aninda
 * genisletilir; her tekrar ayni kaydin (id) bir ornegidir.
 */
export type CalendarEvent = EventItem & {
  /** React anahtari ve serit yerlesimi icin tekil: `${id}@${start}`. */
  occurrenceKey: string;
  /** Seride ilk tarihin disindaki bir tekrar mi. */
  isOccurrence: boolean;
  /** Kaydin tekrar kurali var mi (ilk ornek dahil). */
  hasRepeat: boolean;
};

export type Window = { from: string; to: string };

export function expandEvents(
  events: EventItem[],
  window: Window,
): CalendarEvent[] {
  const out: CalendarEvent[] = [];

  for (const event of events) {
    const rec = recurrenceOf(event);
    const occurrences = expandOccurrences(
      { start: event.start_date, end: event.end_date },
      rec,
      window,
    );
    for (const occurrence of occurrences) {
      out.push({
        ...event,
        start_date: occurrence.start,
        end_date: occurrence.end === occurrence.start ? null : occurrence.end,
        occurrenceKey: `${event.id}@${occurrence.start}`,
        isOccurrence: occurrence.start !== event.start_date,
        hasRepeat: rec.freq !== null,
      });
    }
  }

  return out.sort((a, b) => a.start_date.localeCompare(b.start_date));
}

/** Tekrar ornegine giden baglanti, hangi tekrara bakildigini de tasir. */
export function eventHref(event: CalendarEvent): string {
  return event.isOccurrence
    ? `/takvim/${event.id}?t=${event.start_date}`
    : `/takvim/${event.id}`;
}

/**
 * Gorunum penceresi: gezilen ay ile bugunun ikisini de kapsar, boylece hem
 * takvim hem yan panel (yaklasanlar) dogru veriyi gorur.
 */
export function viewWindow(
  today: string,
  cursor: { year: number; monthIndex: number },
): Window {
  const cursorIso = `${cursor.year}-${String(cursor.monthIndex + 1).padStart(2, "0")}-01`;
  const lower = cursorIso < today ? cursorIso : today;
  const upper = cursorIso > today ? cursorIso : today;
  // Genis pencere: gecmise donuk ajanda ("Geçmişi göster") da veri bulsun.
  // Tekrarlayan serilerin maliyeti MAX_OCCURRENCES ile zaten sinirli.
  return {
    from: shiftMonths(lower, -36),
    to: shiftMonths(upper, 36),
  };
}

function shiftMonths(iso: string, delta: number): string {
  const year = Number(iso.slice(0, 4));
  const monthIndex = Number(iso.slice(5, 7)) - 1 + delta;
  const y = year + Math.floor(monthIndex / 12);
  const m = ((monthIndex % 12) + 12) % 12;
  return `${y}-${String(m + 1).padStart(2, "0")}-01`;
}
