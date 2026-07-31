import { addDays } from "./date";
import type { Recurrence } from "./recurrence";

/**
 * iCalendar (RFC 5545) uretimi. Tekrarlayan seriler genisletilmez; RRULE ve
 * EXDATE olarak yazilir, boylece Outlook/Google seriyi seri olarak gorur.
 *
 * Saat dilimi bilincli olarak yazilmaz: kayitlarimiz tarih (ve opsiyonel yerel
 * saat) tabanli, TZID uydurmak yanlis kaymalar uretir.
 */

export type IcsEvent = {
  uid: string;
  title: string;
  start: string;
  end?: string | null;
  startTime?: string | null;
  endTime?: string | null;
  location?: string | null;
  description?: string | null;
  url?: string | null;
  recurrence?: Recurrence | null;
  /** Son degisiklik damgasi, "20260730T120000Z" bicimi. */
  stamp: string;
};

const WEEKDAY_CODES = ["MO", "TU", "WE", "TH", "FR", "SA", "SU"];

const compact = (iso: string) => iso.replace(/-/g, "");
const clock = (value: string) => value.slice(0, 5).replace(":", "") + "00";

/** RFC 5545: ters bolu, noktali virgul, virgul ve satir sonu kacislanir. */
export function escapeText(value: string): string {
  return value
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\r?\n/g, "\\n");
}

/** Satirlar 75 oktetten uzun olamaz; devam satiri bosluk ile baslar. */
export function foldLine(line: string): string {
  if (line.length <= 75) return line;
  const parts: string[] = [line.slice(0, 75)];
  let rest = line.slice(75);
  while (rest.length > 74) {
    parts.push(` ${rest.slice(0, 74)}`);
    rest = rest.slice(74);
  }
  if (rest.length > 0) parts.push(` ${rest}`);
  return parts.join("\r\n");
}

export function buildRrule(rec: Recurrence, start: string): string | null {
  if (!rec.freq) return null;
  const parts: string[] = [];

  if (rec.freq === "gunluk") parts.push("FREQ=DAILY");
  else if (rec.freq === "haftalik") {
    parts.push("FREQ=WEEKLY");
    const days = rec.weekdays.length > 0 ? rec.weekdays : null;
    if (days) {
      parts.push(
        `BYDAY=${days
          .slice()
          .sort((a, b) => a - b)
          .map((d) => WEEKDAY_CODES[d])
          .join(",")}`,
      );
    }
  } else if (rec.freq === "aylik") {
    parts.push("FREQ=MONTHLY");
    if (rec.monthlyMode === "hafta_gunu") {
      const date = new Date(`${start}T00:00:00Z`);
      const weekday = (date.getUTCDay() + 6) % 7;
      const nth = Math.floor((date.getUTCDate() - 1) / 7) + 1;
      const index = nth >= 5 ? -1 : nth;
      parts.push(`BYDAY=${index}${WEEKDAY_CODES[weekday]}`);
    } else {
      parts.push(`BYMONTHDAY=${Number(start.slice(8, 10))}`);
    }
  } else {
    parts.push("FREQ=YEARLY");
  }

  if (rec.interval > 1) parts.push(`INTERVAL=${rec.interval}`);
  if (rec.until) parts.push(`UNTIL=${compact(rec.until)}`);
  else if (rec.count) parts.push(`COUNT=${rec.count}`);

  return parts.join(";");
}

function eventLines(event: IcsEvent): string[] {
  const lines: string[] = ["BEGIN:VEVENT"];
  lines.push(`UID:${event.uid}`);
  lines.push(`DTSTAMP:${event.stamp}`);

  const endDate = event.end && event.end > event.start ? event.end : event.start;
  if (event.startTime) {
    lines.push(`DTSTART:${compact(event.start)}T${clock(event.startTime)}`);
    const endClock = event.endTime ? clock(event.endTime) : clock(event.startTime);
    lines.push(`DTEND:${compact(endDate)}T${endClock}`);
  } else {
    // Tam gun etkinlikte DTEND haric tutulur: bitis gunu + 1.
    lines.push(`DTSTART;VALUE=DATE:${compact(event.start)}`);
    lines.push(`DTEND;VALUE=DATE:${compact(addDays(endDate, 1))}`);
  }

  lines.push(`SUMMARY:${escapeText(event.title)}`);
  if (event.location) lines.push(`LOCATION:${escapeText(event.location)}`);
  if (event.description) {
    lines.push(`DESCRIPTION:${escapeText(event.description)}`);
  }
  if (event.url) lines.push(`URL:${event.url}`);

  if (event.recurrence) {
    const rrule = buildRrule(event.recurrence, event.start);
    if (rrule) lines.push(`RRULE:${rrule}`);
    if (event.recurrence.skipDates.length > 0) {
      lines.push(
        `EXDATE;VALUE=DATE:${event.recurrence.skipDates.map(compact).join(",")}`,
      );
    }
  }

  lines.push("END:VEVENT");
  return lines;
}

export function buildIcs(events: IcsEvent[], calendarName: string): string {
  const lines: string[] = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//MDP Group//MIP Development Track//TR",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    `X-WR-CALNAME:${escapeText(calendarName)}`,
    ...events.flatMap(eventLines),
    "END:VCALENDAR",
  ];
  return lines.map(foldLine).join("\r\n") + "\r\n";
}
