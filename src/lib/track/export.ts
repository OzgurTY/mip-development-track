import type { BoardRow } from "./types";

export const UPDATE_HEADERS = ["Müşteri", "Tarih", "Güncelleme"] as const;
export const SUMMARY_HEADERS = [
  "Müşteri",
  "Durum",
  "Proje",
  "Lead",
  "Sorumlular",
  "Son güncelleme",
] as const;

export type UpdateForExport = {
  customerName: string;
  week_date: string;
  body: string;
};

/** Update log as a string matrix (one row per weekly update). */
export function updatesToMatrix(updates: UpdateForExport[]): string[][] {
  return updates.map((u) => [u.customerName, u.week_date ?? "", u.body ?? ""]);
}

/** Board snapshot as a string matrix (one row per customer). */
export function boardToMatrix(rows: BoardRow[]): string[][] {
  return rows.map((r) => [
    r.name,
    r.record?.status ?? "",
    r.record?.project ?? "",
    r.record?.lead ?? "",
    r.record?.responsibles ?? "",
    r.lastUpdate?.body ?? "",
  ]);
}

function escapeCsvCell(value: string): string {
  if (/[",\r\n]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

/** RFC 4180 CSV (CRLF rows, quote-escaped cells). */
export function toCsv(
  headers: readonly string[],
  rows: string[][],
): string {
  return [headers, ...rows]
    .map((row) => row.map((cell) => escapeCsvCell(cell)).join(","))
    .join("\r\n");
}
