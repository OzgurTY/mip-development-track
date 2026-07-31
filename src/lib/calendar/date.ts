/**
 * Takvim tarih yardimcilari. Tum hesaplar UTC gece yarisi uzerinden yapilir:
 * etkinlikler `date` kolonunda tutulur, yerel saat dilimi devreye girerse
 * "12 Ekim" kaydi 11 Ekim gorunebilir.
 */

export const MONTHS_TR = [
  "Ocak",
  "Şubat",
  "Mart",
  "Nisan",
  "Mayıs",
  "Haziran",
  "Temmuz",
  "Ağustos",
  "Eylül",
  "Ekim",
  "Kasım",
  "Aralık",
] as const;

/** Pazartesi ile baslar (TR takvim duzeni). */
export const WEEKDAYS_TR = ["Pzt", "Sal", "Çar", "Per", "Cum", "Cmt", "Paz"] as const;

const DAY_MS = 86_400_000;

export function fromIso(iso: string): Date {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(Date.UTC(y, (m ?? 1) - 1, d ?? 1));
}

export function toIso(date: Date): string {
  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, "0");
  const d = String(date.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/** Kullanicinin bugunu: yerel takvim gunu, UTC'ye kaydirilmadan. */
export function todayIso(now: Date = new Date()): string {
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function addDays(iso: string, days: number): string {
  return toIso(new Date(fromIso(iso).getTime() + days * DAY_MS));
}

export function addMonths(year: number, monthIndex: number, delta: number): {
  year: number;
  monthIndex: number;
} {
  const total = year * 12 + monthIndex + delta;
  return { year: Math.floor(total / 12), monthIndex: ((total % 12) + 12) % 12 };
}

/** b - a, tam gun cinsinden. */
export function daysBetween(a: string, b: string): number {
  return Math.round((fromIso(b).getTime() - fromIso(a).getTime()) / DAY_MS);
}

export function daysUntil(iso: string, from: string = todayIso()): number {
  return daysBetween(from, iso);
}

/** Pazartesi = 0, Pazar = 6. */
export function mondayIndex(iso: string): number {
  return (fromIso(iso).getUTCDay() + 6) % 7;
}

export function monthLabel(year: number, monthIndex: number): string {
  return `${MONTHS_TR[monthIndex]} ${year}`;
}

export function formatDayTr(iso: string | null | undefined): string {
  if (!iso) return "-";
  const [y, m, d] = iso.split("-");
  return `${d}.${m}.${y}`;
}

/**
 * "12 Ekim 2026", "12-14 Ekim 2026", "28 Eylül - 2 Ekim 2026",
 * yil farkliysa "28 Aralık 2026 - 2 Ocak 2027".
 */
export function formatRangeTr(start: string, end?: string | null): string {
  const s = fromIso(start);
  const sDay = s.getUTCDate();
  const sMonth = MONTHS_TR[s.getUTCMonth()];
  const sYear = s.getUTCFullYear();

  if (!end || end === start) return `${sDay} ${sMonth} ${sYear}`;

  const e = fromIso(end);
  const eDay = e.getUTCDate();
  const eMonth = MONTHS_TR[e.getUTCMonth()];
  const eYear = e.getUTCFullYear();

  if (sYear !== eYear) {
    return `${sDay} ${sMonth} ${sYear} - ${eDay} ${eMonth} ${eYear}`;
  }
  if (sMonth !== eMonth) return `${sDay} ${sMonth} - ${eDay} ${eMonth} ${sYear}`;
  return `${sDay}-${eDay} ${sMonth} ${sYear}`;
}

/** Saat alanini "14:00" olarak kisaltir (DB'den 14:00:00 gelir). */
export function formatTime(value: string | null | undefined): string | null {
  if (!value) return null;
  return value.slice(0, 5);
}
