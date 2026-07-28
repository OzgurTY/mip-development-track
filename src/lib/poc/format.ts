import { slugify } from "@/lib/utils/slug";
import type { PocRecord } from "./types";

export const EMPTY = "-";

/** ISO tarihi (yyyy-mm-dd) gg.aa.yyyy olarak gosterir. */
export function formatDay(value: string | null | undefined): string {
  if (!value) return EMPTY;
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return value;
  return `${match[3]}.${match[2]}.${match[1]}`;
}

export function formatRange(
  start: string | null | undefined,
  end: string | null | undefined,
): string {
  if (!start && !end) return EMPTY;
  return `${formatDay(start)} - ${formatDay(end)}`;
}

export function orEmpty(value: string | null | undefined): string {
  const trimmed = (value ?? "").trim();
  return trimmed === "" ? EMPTY : trimmed;
}

export type CriteriaScore = { met: number; scored: number; total: number };

type Criterion = { status: string };

/** Genel kriterler + tum sureclerin kendi kriterleri tek skorda toplanir. */
export function criteriaScore(record: {
  criteria: Criterion[];
  processes: { criteria: Criterion[] }[];
}): CriteriaScore {
  const all: Criterion[] = [
    ...record.criteria,
    ...record.processes.flatMap((p) => p.criteria),
  ];
  return {
    met: all.filter((c) => c.status === "Karşılandı").length,
    scored: all.filter((c) => c.status !== "").length,
    total: all.length,
  };
}

/** poc-<musteri>-<baslik>-<tarih> seklinde ASCII guvenli dosya adi. */
export function exportFileName(
  record: Pick<PocRecord, "title">,
  customerName: string,
): string {
  const today = new Date().toISOString().slice(0, 10);
  const parts = [
    "poc",
    slugify(customerName) || "musteri",
    slugify(record.title) || "rapor",
    today,
  ];
  return parts.join("-");
}
