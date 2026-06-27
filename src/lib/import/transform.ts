import { slugify } from "../utils/slug";
import { TRACK_STATUSES } from "../track/types";
import { resolveCustomerName } from "./aliases";
import {
  cleanText,
  cleanVersion,
  isUpdateBody,
  normalizeDbType,
  normalizeDeployment,
  normalizeStatus,
  parseMipDate,
  parseWeekDate,
} from "./normalize";
import type {
  Cell,
  ImportCustomer,
  ImportFlag,
  ImportVersionRecord,
  TrackPlan,
  VersionPlan,
} from "./types";

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

// Bileşen sütunları (0-indeks) -> custom_fields anahtarı. db_type (col 9) ayrı
// ele alınır (normalizeDbType). MIP (col 7) tarih olarak parse edilir.
const COMPONENT_COLUMNS: { col: number; key: string; date?: boolean }[] = [
  { col: 7, key: "mip", date: true },
  { col: 8, key: "camel" },
  { col: 10, key: "redis" },
  { col: 11, key: "activemq" },
  { col: 12, key: "grafana" },
  { col: 13, key: "prometheus" },
  { col: 14, key: "postgresql" },
  { col: 15, key: "elasticsearch" },
  { col: 16, key: "api_management" },
  { col: 17, key: "ai_monitoring" },
  { col: 18, key: "backup_method" },
  { col: 19, key: "note" },
];

// Sürüm sayfası: her satır bir ortam (Prod/Dev/POC). Müşteri adı kanonik
// takip adına uzlaştırılır; takipte hiç olmayan adlar yeni müşteri + uyarı.
export function buildVersionPlan(
  rows: Cell[][],
  canonicalNames: string[],
): VersionPlan {
  const canonical = new Map<string, string>();
  for (const n of canonicalNames) canonical.set(n.toLowerCase(), n);

  const records: ImportVersionRecord[] = [];
  const newCustomers: ImportCustomer[] = [];
  const flags: ImportFlag[] = [];
  const newSeen = new Set<string>();

  for (const row of rows.slice(1)) {
    const rawName = cleanText(row[0]);
    if (!rawName) continue;

    const resolved = resolveCustomerName(rawName, canonical);
    if (resolved.isNew) {
      const lower = resolved.name.toLowerCase();
      if (!newSeen.has(lower)) {
        newSeen.add(lower);
        newCustomers.push({
          name: resolved.name,
          slug: slugify(resolved.name),
          source: "version-only",
        });
        flags.push({
          kind: "unknown-customer",
          context: "MIP List",
          value: rawName,
        });
      }
    }

    const deployment = normalizeDeployment(row[5]);
    if (deployment.flag) {
      flags.push({
        kind: "unrecognized-value",
        context: `OnPremise/Cloud (${resolved.name})`,
        value: deployment.flag,
      });
    }

    const customFields: Record<string, string> = {};
    const dbType = normalizeDbType(row[9]);
    if (dbType) customFields.db_type = dbType;
    for (const c of COMPONENT_COLUMNS) {
      const value = c.date
        ? parseMipDate(row[c.col])
        : cleanVersion(row[c.col]);
      if (value) customFields[c.key] = value;
    }

    records.push({
      customerName: resolved.name,
      system: cleanText(row[1]),
      middleware: cleanText(row[2]),
      package: cleanText(row[3]),
      status: normalizeStatus(row[4]),
      deployment: deployment.value,
      os: cleanText(row[6]),
      customFields,
    });
  }

  return { records, newCustomers, flags };
}
