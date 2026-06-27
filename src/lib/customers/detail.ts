import { createClient } from "@/lib/supabase/server";
import { getComponentLatest } from "@/lib/versions/queries";
import type { ComponentLatest, VersionRecord } from "@/lib/versions/types";
import type { TrackRecord, TrackUpdate } from "@/lib/track/types";

export type CustomerDetail = {
  customer: {
    id: string;
    name: string;
    is_active: boolean;
    custom_fields: Record<string, unknown>;
  };
  record: TrackRecord | null;
  updates: TrackUpdate[];
  versions: VersionRecord[];
  components: ComponentLatest[];
};

export async function getCustomerDetail(
  id: string,
): Promise<CustomerDetail | null> {
  const supabase = await createClient();
  const { data: customer } = await supabase
    .from("customers")
    .select("id, name, is_active, custom_fields")
    .eq("id", id)
    .maybeSingle();
  if (!customer) return null;

  const [record, updates, versions, components] = await Promise.all([
    supabase
      .from("track_records")
      .select(
        "customer_id, status, project, scope, lead, responsibles, custom_fields",
      )
      .eq("customer_id", id)
      .maybeSingle(),
    supabase
      .from("track_updates")
      .select("id, customer_id, week_date, body, created_at")
      .eq("customer_id", id)
      .order("week_date", { ascending: false })
      .limit(12),
    supabase
      .from("version_records")
      .select(
        "id, customer_id, system, deployment, os, status, middleware, package, custom_fields",
      )
      .eq("customer_id", id)
      .order("system"),
    getComponentLatest(),
  ]);

  return {
    customer: customer as CustomerDetail["customer"],
    record: (record.data as TrackRecord) ?? null,
    updates: (updates.data ?? []) as TrackUpdate[],
    versions: (versions.data ?? []) as VersionRecord[],
    components,
  };
}
