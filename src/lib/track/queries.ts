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
