import { slugify } from "../utils/slug";
import { TRACK_STATUSES } from "../track/types";
import { cleanText, isUpdateBody, parseWeekDate } from "./normalize";
import type { Cell, ImportCustomer, TrackPlan } from "./types";

const STATUS_SET = new Set<string>(TRACK_STATUSES);

function trackStatus(cell: Cell): string | null {
  const s = cleanText(cell);
  return s && STATUS_SET.has(s) ? s : null;
}

// Takip sayfası: satır başı 1 müşteri + 1 takip kaydı; 28 haftalık sütun
// geniş->uzun açılır (yalnız metin hücreleri güncelleme üretir).
export function buildTrackPlan(rows: Cell[][]): TrackPlan {
  const header = rows[0] ?? [];
  const weekDates = header.slice(6, 34).map(parseWeekDate);

  const customers: ImportCustomer[] = [];
  const records: TrackPlan["records"] = [];
  const updates: TrackPlan["updates"] = [];
  const seen = new Set<string>();

  for (const row of rows.slice(1)) {
    const name = cleanText(row[0]);
    if (!name) continue;

    const lower = name.toLowerCase();
    if (!seen.has(lower)) {
      seen.add(lower);
      customers.push({ name, slug: slugify(name), source: "track" });
    }

    records.push({
      customerName: name,
      status: trackStatus(row[1]),
      project: cleanText(row[2]),
      scope: cleanText(row[3]),
      responsibles: cleanText(row[4]),
      lead: cleanText(row[5]),
    });

    for (let c = 6; c < 34; c++) {
      const weekDate = weekDates[c - 6];
      if (!weekDate) continue;
      const body = isUpdateBody(row[c]);
      if (!body) continue;
      updates.push({ customerName: name, weekDate, body });
    }
  }

  return { customers, records, updates };
}
