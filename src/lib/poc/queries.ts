import { createClient } from "@/lib/supabase/server";
import {
  criterionSchema,
  parseRows,
  processSchema,
  workSchema,
} from "./schema";
import { criteriaScore } from "./format";
import type { PocListRow, PocRecord } from "./types";

const COLUMNS =
  "id, customer_id, customer_name, title, status, result, start_date, end_date, deployment, " +
  "team_mdp, team_customer, purpose, out_of_scope, server_info, os_info, " +
  "mip_version, install_date, access_note, install_result, " +
  "processes, works, criteria, updated_at";

/** Supabase iliskili tabloyu duruma gore tekil nesne veya dizi olarak dondurur. */
type JoinedCustomer = { name: string } | { name: string }[] | null;

type RawRow = Record<string, unknown> & {
  customers?: JoinedCustomer;
};

function joinedName(row: RawRow): string {
  const joined = row.customers;
  if (!joined) return "";
  if (Array.isArray(joined)) return joined[0]?.name ?? "";
  return joined.name ?? "";
}

/**
 * Firma adi once kaydin kendi alanindan okunur; 0016 oncesi olusmus
 * kayitlarda bagli musteri adina duser.
 */
function customerNameOf(row: RawRow): string {
  const own = String(row.customer_name ?? "").trim();
  return own !== "" ? own : joinedName(row);
}

function toRecord(row: RawRow): PocRecord {
  return {
    id: String(row.id),
    customer_id: (row.customer_id as string | null) ?? null,
    customer_name: customerNameOf(row),
    title: String(row.title ?? ""),
    status: String(row.status ?? ""),
    result: (row.result as string | null) ?? null,
    start_date: (row.start_date as string | null) ?? null,
    end_date: (row.end_date as string | null) ?? null,
    deployment: (row.deployment as string | null) ?? null,
    team_mdp: (row.team_mdp as string | null) ?? null,
    team_customer: (row.team_customer as string | null) ?? null,
    purpose: (row.purpose as string | null) ?? null,
    out_of_scope: (row.out_of_scope as string | null) ?? null,
    server_info: (row.server_info as string | null) ?? null,
    os_info: (row.os_info as string | null) ?? null,
    mip_version: (row.mip_version as string | null) ?? null,
    install_date: (row.install_date as string | null) ?? null,
    access_note: (row.access_note as string | null) ?? null,
    install_result: (row.install_result as string | null) ?? null,
    processes: parseRows(processSchema, row.processes),
    works: parseRows(workSchema, row.works),
    criteria: parseRows(criterionSchema, row.criteria),
    updated_at: String(row.updated_at ?? ""),
  };
}

export async function getPocList(): Promise<PocListRow[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("poc_records")
    .select(`${COLUMNS}, customers ( name )`)
    .order("updated_at", { ascending: false });

  return ((data ?? []) as unknown as RawRow[]).map((row) => {
    const record = toRecord(row);
    const score = criteriaScore(record);
    return {
      id: record.id,
      title: record.title,
      status: record.status,
      result: record.result,
      start_date: record.start_date,
      end_date: record.end_date,
      updated_at: record.updated_at,
      customerId: record.customer_id,
      customerName: record.customer_name || "-",
      processCount: record.processes.length,
      criteriaMet: score.met,
      criteriaTotal: score.total,
    };
  });
}

export type PocDetail = { record: PocRecord; customerName: string };

export async function getPocRecord(id: string): Promise<PocDetail | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("poc_records")
    .select(`${COLUMNS}, customers ( name )`)
    .eq("id", id)
    .maybeSingle();

  if (!data) return null;
  const record = toRecord(data as unknown as RawRow);
  return { record, customerName: record.customer_name || "-" };
}
