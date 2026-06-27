/**
 * inputs/Integration Customer General List.xlsx için tek seferlik, idempotent içe aktarıcı.
 *
 *   pnpm tsx scripts/import-excel.ts            # dry-run (varsayılan): planı yazdırır, DB'ye yazmaz
 *   pnpm tsx scripts/import-excel.ts --apply    # cloud DB'ye yazar (idempotent)
 *   pnpm tsx scripts/import-excel.ts --verify   # geri okuyup satır sayılarını yazdırır
 *
 * service_role admin client kullanır (RLS'i atlar; yönetimsel import için doğru).
 * Env .env.local'dan okunur.
 */
import { config } from "dotenv";
config({ path: ".env.local" });

import ExcelJS from "exceljs";
import { createAdminClient } from "../src/lib/supabase/admin";
import { buildTrackPlan, buildVersionPlan } from "../src/lib/import/transform";
import type {
  Cell,
  ImportCustomer,
  ImportTrackRecord,
  ImportTrackUpdate,
  ImportVersionRecord,
} from "../src/lib/import/types";

const FILE = "inputs/Integration Customer General List.xlsx";
const TRACK_SHEET = "MIP Active Project List";
const VERSION_SHEET = "MIP List";

type Admin = ReturnType<typeof createAdminClient>;
type Mode = "dry-run" | "apply" | "verify";

const mode: Mode = process.argv.includes("--apply")
  ? "apply"
  : process.argv.includes("--verify")
    ? "verify"
    : "dry-run";

function toCell(value: ExcelJS.CellValue): Cell {
  if (value === null || value === undefined) return null;
  if (value instanceof Date) return value;
  if (typeof value === "number" || typeof value === "string") return value;
  if (typeof value === "object") {
    const obj = value as { text?: unknown; result?: unknown };
    if ("text" in obj && obj.text != null) return String(obj.text);
    if ("result" in obj && obj.result != null) {
      return toCell(obj.result as ExcelJS.CellValue);
    }
  }
  return String(value);
}

function readSheet(ws: ExcelJS.Worksheet): Cell[][] {
  const cols = ws.columnCount;
  const out: Cell[][] = [];
  ws.eachRow({ includeEmpty: true }, (row) => {
    const arr: Cell[] = [];
    for (let c = 1; c <= cols; c++) arr.push(toCell(row.getCell(c).value));
    out.push(arr);
  });
  return out;
}

async function loadCustomerIds(supabase: Admin): Promise<Map<string, string>> {
  const map = new Map<string, string>();
  const { data, error } = await supabase.from("customers").select("id, name");
  if (error) throw error;
  for (const c of data ?? []) map.set(String(c.name).trim().toLowerCase(), c.id);
  return map;
}

async function applyCustomers(supabase: Admin, customers: ImportCustomer[]) {
  const existing = await loadCustomerIds(supabase);
  const toInsert = customers.filter((c) => !existing.has(c.name.toLowerCase()));
  if (toInsert.length === 0) {
    console.log("Müşteri: hepsi zaten var.");
    return;
  }
  const { error } = await supabase.from("customers").insert(
    toInsert.map((c) => ({ name: c.name, slug: c.slug, is_active: true })),
  );
  if (error) throw error;
  console.log(`Müşteri eklendi: ${toInsert.length}`);
}

async function applyTrackRecords(
  supabase: Admin,
  records: ImportTrackRecord[],
  idByName: Map<string, string>,
) {
  const rows = records
    .map((r) => {
      const customer_id = idByName.get(r.customerName.toLowerCase());
      if (!customer_id) return null;
      return {
        customer_id,
        status: r.status,
        project: r.project,
        scope: r.scope,
        lead: r.lead,
        responsibles: r.responsibles,
      };
    })
    .filter((r): r is NonNullable<typeof r> => r !== null);
  const { error } = await supabase
    .from("track_records")
    .upsert(rows, { onConflict: "customer_id" });
  if (error) throw error;
  console.log(`Takip kaydı yazıldı: ${rows.length}`);
}

async function applyTrackUpdates(
  supabase: Admin,
  updates: ImportTrackUpdate[],
  idByName: Map<string, string>,
) {
  const ids = [
    ...new Set(
      updates
        .map((u) => idByName.get(u.customerName.toLowerCase()))
        .filter(Boolean) as string[],
    ),
  ];
  const seen = new Set<string>();
  if (ids.length) {
    const { data, error } = await supabase
      .from("track_updates")
      .select("customer_id, week_date, body")
      .in("customer_id", ids);
    if (error) throw error;
    for (const u of data ?? []) seen.add(`${u.customer_id}|${u.week_date}|${u.body}`);
  }
  const rows = updates
    .map((u) => {
      const customer_id = idByName.get(u.customerName.toLowerCase());
      if (!customer_id) return null;
      const key = `${customer_id}|${u.weekDate}|${u.body}`;
      if (seen.has(key)) return null;
      seen.add(key);
      return { customer_id, week_date: u.weekDate, body: u.body };
    })
    .filter((r): r is NonNullable<typeof r> => r !== null);
  if (rows.length === 0) {
    console.log("Haftalık güncelleme: yeni yok.");
    return;
  }
  for (let i = 0; i < rows.length; i += 200) {
    const { error } = await supabase
      .from("track_updates")
      .insert(rows.slice(i, i + 200));
    if (error) throw error;
  }
  console.log(`Haftalık güncelleme yazıldı: ${rows.length}`);
}

async function applyVersionRecords(
  supabase: Admin,
  records: ImportVersionRecord[],
  idByName: Map<string, string>,
) {
  const ids = [
    ...new Set(
      records
        .map((r) => idByName.get(r.customerName.toLowerCase()))
        .filter(Boolean) as string[],
    ),
  ];
  const existing = new Map<string, string>();
  if (ids.length) {
    const { data, error } = await supabase
      .from("version_records")
      .select("id, customer_id, system")
      .in("customer_id", ids);
    if (error) throw error;
    for (const v of data ?? []) {
      existing.set(`${v.customer_id}|${v.system ?? ""}`, v.id);
    }
  }
  let inserted = 0;
  let updated = 0;
  for (const r of records) {
    const customer_id = idByName.get(r.customerName.toLowerCase());
    if (!customer_id) continue;
    const payload = {
      customer_id,
      system: r.system,
      deployment: r.deployment,
      os: r.os,
      status: r.status,
      middleware: r.middleware,
      package: r.package,
      custom_fields: r.customFields,
    };
    const key = `${customer_id}|${r.system ?? ""}`;
    const existingId = existing.get(key);
    if (existingId) {
      const { error } = await supabase
        .from("version_records")
        .update(payload)
        .eq("id", existingId);
      if (error) throw error;
      updated++;
    } else {
      const { data, error } = await supabase
        .from("version_records")
        .insert(payload)
        .select("id")
        .single();
      if (error) throw error;
      if (data) existing.set(key, data.id);
      inserted++;
    }
  }
  console.log(`Sürüm kaydı: ${inserted} eklendi, ${updated} güncellendi`);
}

async function main() {
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.readFile(FILE);
  const trackWs = wb.getWorksheet(TRACK_SHEET);
  const versionWs = wb.getWorksheet(VERSION_SHEET);
  if (!trackWs || !versionWs) {
    throw new Error(
      "Beklenen sayfalar bulunamadı (MIP Active Project List / MIP List)",
    );
  }

  const track = buildTrackPlan(readSheet(trackWs));
  const version = buildVersionPlan(
    readSheet(versionWs),
    track.customers.map((c) => c.name),
  );
  const customers: ImportCustomer[] = [
    ...track.customers,
    ...version.newCustomers,
  ];

  console.log("=== MIP Excel Import ===");
  console.log(`Mod: ${mode}`);
  console.log(`Müşteri (toplam): ${customers.length}`);
  console.log(`  - takip sayfasından: ${track.customers.length}`);
  console.log(`  - yalnız sürüm sayfasında: ${version.newCustomers.length}`);
  console.log(`Takip kaydı: ${track.records.length}`);
  console.log(`Haftalık güncelleme: ${track.updates.length}`);
  console.log(`Sürüm kaydı: ${version.records.length}`);
  console.log(`Uyarı: ${version.flags.length}`);
  for (const f of version.flags) {
    console.log(`  [${f.kind}] ${f.context}: ${JSON.stringify(f.value)}`);
  }
  if (version.newCustomers.length) {
    console.log("Yeni müşteriler (yalnız sürüm sayfasında):");
    for (const c of version.newCustomers) console.log(`  - ${c.name}`);
  }

  if (mode === "dry-run") {
    console.log("\nDry-run: hiçbir şey yazılmadı. Uygulamak için --apply ekleyin.");
    return;
  }

  const supabase = createAdminClient();

  if (mode === "verify") {
    for (const t of [
      "customers",
      "track_records",
      "track_updates",
      "version_records",
    ]) {
      const { count, error } = await supabase
        .from(t)
        .select("*", { count: "exact", head: true });
      if (error) throw error;
      console.log(`DB ${t}: ${count}`);
    }
    return;
  }

  // mode === "apply"
  await applyCustomers(supabase, customers);
  const idByName = await loadCustomerIds(supabase);
  await applyTrackRecords(supabase, track.records, idByName);
  await applyTrackUpdates(supabase, track.updates, idByName);
  await applyVersionRecords(supabase, version.records, idByName);
  console.log("\nApply tamam.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
