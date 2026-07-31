import {
  MONTHS_TR,
  addDays,
  daysBetween,
  formatDayTr,
  fromIso,
  mondayIndex,
  toIso,
} from "./date";

export const REPEAT_FREQS = ["gunluk", "haftalik", "aylik", "yillik"] as const;
export type RepeatFreq = (typeof REPEAT_FREQS)[number];

export const REPEAT_FREQ_LABEL: Record<RepeatFreq, string> = {
  gunluk: "Günlük",
  haftalik: "Haftalık",
  aylik: "Aylık",
  yillik: "Yıllık",
};

export type MonthlyMode = "gun" | "hafta_gunu";

export type Recurrence = {
  freq: RepeatFreq | null;
  /** Kacta bir: 1 = her, 2 = iki ... */
  interval: number;
  /** Haftalik icin gunler, 0 = Pazartesi. Bos ise baslangicin gunu. */
  weekdays: number[];
  monthlyMode: MonthlyMode;
  until: string | null;
  count: number | null;
  skipDates: string[];
};

export const NO_REPEAT: Recurrence = {
  freq: null,
  interval: 1,
  weekdays: [],
  monthlyMode: "gun",
  until: null,
  count: null,
  skipDates: [],
};

/** Sonsuz seri korumasi: bir seri en fazla bu kadar tekrar uretir. */
export const MAX_OCCURRENCES = 400;

const WEEKDAY_FULL_TR = [
  "Pazartesi",
  "Salı",
  "Çarşamba",
  "Perşembe",
  "Cuma",
  "Cumartesi",
  "Pazar",
];
const WEEKDAY_SHORT_TR = ["Pzt", "Sal", "Çar", "Per", "Cum", "Cmt", "Paz"];
/** Iyelik ekli hali: Turkce ses uyumu kural ile uretilemedigi icin sabit. */
const WEEKDAY_POSSESSIVE_TR = [
  "Pazartesisi",
  "Salısı",
  "Çarşambası",
  "Perşembesi",
  "Cuması",
  "Cumartesisi",
  "Pazarı",
];

/** Ayin kacinci hafta gunu: 7 Ekim Carsamba ise 1 (ilk Carsamba). */
export function weekOfMonth(iso: string): number {
  return Math.floor((fromIso(iso).getUTCDate() - 1) / 7) + 1;
}

function daysInMonth(year: number, monthIndex: number): number {
  return new Date(Date.UTC(year, monthIndex + 1, 0)).getUTCDate();
}

/** Verilen ayin N. (5 = son) hafta gununu bulur; yoksa null. */
function nthWeekdayOfMonth(
  year: number,
  monthIndex: number,
  weekday: number,
  nth: number,
): string | null {
  const total = daysInMonth(year, monthIndex);
  const matches: string[] = [];
  for (let day = 1; day <= total; day += 1) {
    const iso = toIso(new Date(Date.UTC(year, monthIndex, day)));
    if (mondayIndex(iso) === weekday) matches.push(iso);
  }
  if (matches.length === 0) return null;
  if (nth >= 5) return matches[matches.length - 1];
  return matches[nth - 1] ?? null;
}

export type Occurrence = { start: string; end: string };

/**
 * Kurali verilen pencere icinde genisletir. Kayitli tek tarih (tekrar yok)
 * durumunda tek eleman doner. Cok gunluk etkinlikte sure korunur.
 *
 * Pencere yalnizca GORUNTULEME sinirini daraltir; count/until semantigi
 * pencereden bagimsiz calisir, yoksa "12 tekrar" penceredeki 12 olurdu.
 */
export function expandOccurrences(
  base: { start: string; end?: string | null },
  rec: Recurrence,
  window: { from: string; to: string },
): Occurrence[] {
  const duration =
    base.end && base.end > base.start ? daysBetween(base.start, base.end) : 0;
  const skip = new Set(rec.skipDates);

  const clip = (starts: string[]): Occurrence[] =>
    starts
      .filter((start) => !skip.has(start))
      .map((start) => ({ start, end: addDays(start, duration) }))
      .filter((occ) => occ.end >= window.from && occ.start <= window.to);

  if (!rec.freq) return clip([base.start]);
  if (rec.until && rec.until < base.start) return [];

  const interval = Math.max(1, rec.interval);
  const limit = Math.min(rec.count ?? MAX_OCCURRENCES, MAX_OCCURRENCES);
  const starts: string[] = [];

  const push = (iso: string): boolean => {
    if (rec.until && iso > rec.until) return false;
    starts.push(iso);
    return starts.length < limit;
  };

  if (rec.freq === "gunluk") {
    let cursor = base.start;
    while (push(cursor)) {
      cursor = addDays(cursor, interval);
      if (cursor > window.to && !rec.count) break;
    }
    return clip(starts);
  }

  if (rec.freq === "haftalik") {
    const days = (rec.weekdays.length > 0 ? rec.weekdays : [mondayIndex(base.start)])
      .filter((d) => d >= 0 && d <= 6)
      .sort((a, b) => a - b);
    // Haftanin pazartesisinden basla, her `interval` haftada bir gunleri gez.
    let weekStart = addDays(base.start, -mondayIndex(base.start));
    let running = true;
    while (running) {
      for (const day of days) {
        const iso = addDays(weekStart, day);
        if (iso < base.start) continue;
        if (!push(iso)) {
          running = false;
          break;
        }
      }
      weekStart = addDays(weekStart, interval * 7);
      if (weekStart > window.to && !rec.count) break;
    }
    return clip(starts);
  }

  if (rec.freq === "aylik") {
    const first = fromIso(base.start);
    const dayOfMonth = first.getUTCDate();
    const weekday = mondayIndex(base.start);
    const nth = weekOfMonth(base.start);
    let year = first.getUTCFullYear();
    let monthIndex = first.getUTCMonth();
    let steps = 0;

    while (steps < MAX_OCCURRENCES) {
      let iso: string | null;
      if (rec.monthlyMode === "hafta_gunu") {
        iso = nthWeekdayOfMonth(year, monthIndex, weekday, nth);
      } else {
        // Ayin o gunu yoksa (31 Subat) o ay atlanir.
        iso =
          dayOfMonth <= daysInMonth(year, monthIndex)
            ? toIso(new Date(Date.UTC(year, monthIndex, dayOfMonth)))
            : null;
      }
      if (iso && iso >= base.start && !push(iso)) break;

      const next = monthIndex + interval;
      year += Math.floor(next / 12);
      monthIndex = ((next % 12) + 12) % 12;
      steps += 1;
      if (
        !rec.count &&
        toIso(new Date(Date.UTC(year, monthIndex, 1))) > window.to
      ) {
        break;
      }
    }
    return clip(starts);
  }

  // yillik
  const first = fromIso(base.start);
  const dayOfMonth = first.getUTCDate();
  const monthIndex = first.getUTCMonth();
  let year = first.getUTCFullYear();
  let steps = 0;
  while (steps < MAX_OCCURRENCES) {
    if (dayOfMonth <= daysInMonth(year, monthIndex)) {
      const iso = toIso(new Date(Date.UTC(year, monthIndex, dayOfMonth)));
      if (iso >= base.start && !push(iso)) break;
    }
    year += interval;
    steps += 1;
    if (!rec.count && toIso(new Date(Date.UTC(year, monthIndex, 1))) > window.to) {
      break;
    }
  }
  return clip(starts);
}

/** "Her ayın 1. Çarşambası · 31.12.2027'ye kadar" gibi okunur ozet. */
export function describeRecurrence(
  base: { start: string },
  rec: Recurrence,
): string | null {
  if (!rec.freq) return null;
  const interval = Math.max(1, rec.interval);
  const date = fromIso(base.start);
  let text: string;

  if (rec.freq === "gunluk") {
    text = interval === 1 ? "Her gün" : `${interval} günde bir`;
  } else if (rec.freq === "haftalik") {
    const days = (rec.weekdays.length > 0 ? rec.weekdays : [mondayIndex(base.start)])
      .slice()
      .sort((a, b) => a - b)
      .map((d) => WEEKDAY_SHORT_TR[d])
      .join(", ");
    text = interval === 1 ? `Her hafta ${days}` : `${interval} haftada bir ${days}`;
  } else if (rec.freq === "aylik") {
    const detail =
      rec.monthlyMode === "hafta_gunu"
        ? `${ordinal(weekOfMonth(base.start))} ${WEEKDAY_POSSESSIVE_TR[mondayIndex(base.start)]}`
        : `${date.getUTCDate()}. günü`;
    text =
      interval === 1
        ? `Her ayın ${detail}`
        : `${interval} ayda bir, ayın ${detail}`;
  } else {
    const detail = `${date.getUTCDate()} ${MONTHS_TR[date.getUTCMonth()]}`;
    text = interval === 1 ? `Her yıl ${detail}` : `${interval} yılda bir ${detail}`;
  }

  if (rec.until) return `${text} · ${formatDayTr(rec.until)} tarihine kadar`;
  if (rec.count) return `${text} · ${rec.count} tekrar`;
  return text;
}

function ordinal(n: number): string {
  return n >= 5 ? "son" : `${n}.`;
}

export { WEEKDAY_FULL_TR, WEEKDAY_SHORT_TR, WEEKDAY_POSSESSIVE_TR };
