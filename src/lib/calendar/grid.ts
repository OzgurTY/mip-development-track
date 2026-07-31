import { addDays, daysBetween, mondayIndex, toIso, todayIso } from "./date";

export type GridDay = {
  iso: string;
  day: number;
  inMonth: boolean;
  isToday: boolean;
};

export type GridWeek = {
  startIso: string;
  days: GridDay[];
};

/** Sabit 6 satir: ay degistirince izgara yuksekligi ziplamaz. */
const WEEKS = 6;

export function buildMonthGrid(
  year: number,
  monthIndex: number,
  today: string = todayIso(),
): GridWeek[] {
  const first = toIso(new Date(Date.UTC(year, monthIndex, 1)));
  const gridStart = addDays(first, -mondayIndex(first));

  const weeks: GridWeek[] = [];
  for (let w = 0; w < WEEKS; w += 1) {
    const startIso = addDays(gridStart, w * 7);
    const days: GridDay[] = [];
    for (let d = 0; d < 7; d += 1) {
      const iso = addDays(startIso, d);
      const date = new Date(`${iso}T00:00:00Z`);
      days.push({
        iso,
        day: date.getUTCDate(),
        inMonth: date.getUTCMonth() === monthIndex,
        isToday: iso === today,
      });
    }
    weeks.push({ startIso, days });
  }
  return weeks;
}

export type BandInput = {
  id: string;
  start: string;
  /** Bos ise tek gunluk kabul edilir. */
  end?: string | null;
};

export type Band<T extends BandInput> = {
  item: T;
  /** 0 = Pazartesi. */
  startCol: number;
  span: number;
  continuesLeft: boolean;
  continuesRight: boolean;
  lane: number;
};

/**
 * Bir haftanin serit yerlesimi. Cok gunluk etkinlik hucre hucre cip yerine
 * tek serit olarak uzanir; cakisanlar alt alta seritlere (lane) dizilir.
 */
export function layoutWeekBands<T extends BandInput>(
  items: T[],
  weekStartIso: string,
): Band<T>[] {
  const weekEndIso = addDays(weekStartIso, 6);

  const overlapping = items
    .map((item) => {
      const start = item.start;
      const end = item.end && item.end > item.start ? item.end : item.start;
      if (end < weekStartIso || start > weekEndIso) return null;

      const clampedStart = start < weekStartIso ? weekStartIso : start;
      const clampedEnd = end > weekEndIso ? weekEndIso : end;
      const startCol = daysBetween(weekStartIso, clampedStart);
      const endCol = daysBetween(weekStartIso, clampedEnd);

      return {
        item,
        startCol,
        span: endCol - startCol + 1,
        continuesLeft: start < weekStartIso,
        continuesRight: end > weekEndIso,
        endCol,
      };
    })
    .filter((band): band is NonNullable<typeof band> => band !== null);

  // Uzun seritler uste: once baslangica, sonra uzunluga, en son id'ye gore
  // sirala ki yerlesim her render'da ayni olsun.
  overlapping.sort(
    (a, b) =>
      a.startCol - b.startCol ||
      b.span - a.span ||
      a.item.id.localeCompare(b.item.id),
  );

  const lanes: number[] = []; // her lane icin dolu son kolon
  return overlapping.map((band) => {
    let lane = lanes.findIndex((lastCol) => lastCol < band.startCol);
    if (lane === -1) {
      lanes.push(band.endCol);
      lane = lanes.length - 1;
    } else {
      lanes[lane] = band.endCol;
    }
    return {
      item: band.item,
      startCol: band.startCol,
      span: band.span,
      continuesLeft: band.continuesLeft,
      continuesRight: band.continuesRight,
      lane,
    };
  });
}
