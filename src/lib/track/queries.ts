import { createClient } from "@/lib/supabase/server";
import type { BoardRow, TrackRecord, TrackUpdate } from "./types";

export async function getTrackBoard(): Promise<BoardRow[]> {
  const supabase = await createClient();
  const [customers, records, updates] = await Promise.all([
    supabase.from("customers").select("id, name").order("name"),
    supabase
      .from("track_records")
      .select(
        "customer_id, status, project, scope, lead, responsibles, custom_fields",
      ),
    supabase
      .from("track_updates")
      .select("id, customer_id, week_date, body, created_at")
      .order("week_date", { ascending: false }),
  ]);

  const recordByCustomer = new Map<string, TrackRecord>();
  for (const r of records.data ?? []) {
    recordByCustomer.set(r.customer_id, r as TrackRecord);
  }
  const latestByCustomer = new Map<string, TrackUpdate>();
  for (const u of (updates.data ?? []) as TrackUpdate[]) {
    if (!latestByCustomer.has(u.customer_id)) latestByCustomer.set(u.customer_id, u);
  }

  return (customers.data ?? []).map((c) => ({
    customerId: c.id,
    name: c.name,
    record: recordByCustomer.get(c.id) ?? null,
    lastUpdate: latestByCustomer.get(c.id) ?? null,
  }));
}

export type ExportUpdate = {
  customerId: string;
  customerName: string;
  week_date: string;
  body: string;
  created_at: string;
};

// All updates (or one customer's), joined with customer names, sorted by
// customer then date. Used by the export route.
export async function getUpdatesForExport(
  customerId?: string,
): Promise<ExportUpdate[]> {
  const supabase = await createClient();
  const updatesQuery = supabase
    .from("track_updates")
    .select("customer_id, week_date, body, created_at");
  const [customers, updates] = await Promise.all([
    supabase.from("customers").select("id, name"),
    customerId ? updatesQuery.eq("customer_id", customerId) : updatesQuery,
  ]);

  const nameById = new Map<string, string>();
  for (const c of customers.data ?? []) nameById.set(c.id, c.name);

  return (updates.data ?? [])
    .map((u) => ({
      customerId: u.customer_id as string,
      customerName: nameById.get(u.customer_id as string) ?? "?",
      week_date: u.week_date as string,
      body: (u.body as string) ?? "",
      created_at: u.created_at as string,
    }))
    .sort(
      (a, b) =>
        a.customerName.localeCompare(b.customerName, "tr") ||
        a.week_date.localeCompare(b.week_date),
    );
}

export async function getCustomerUpdates(
  customerId: string,
): Promise<TrackUpdate[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("track_updates")
    .select("id, customer_id, week_date, body, created_at")
    .eq("customer_id", customerId)
    .order("week_date", { ascending: false });
  return (data ?? []) as TrackUpdate[];
}
