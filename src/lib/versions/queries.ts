import { createClient } from "@/lib/supabase/server";
import type { ComponentLatest, MatrixRow, VersionRecord } from "./types";

export async function getComponentLatest(): Promise<ComponentLatest[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("component_latest")
    .select("key, label, kind, latest_version, source_note")
    .order("key");
  return (data ?? []) as ComponentLatest[];
}

export async function getVersionMatrix(): Promise<MatrixRow[]> {
  const supabase = await createClient();
  const [customers, records] = await Promise.all([
    supabase.from("customers").select("id, name"),
    supabase
      .from("version_records")
      .select(
        "id, customer_id, system, deployment, os, status, middleware, package, custom_fields",
      ),
  ]);
  const nameById = new Map<string, string>();
  for (const c of customers.data ?? []) nameById.set(c.id, c.name);
  return ((records.data ?? []) as VersionRecord[])
    .map((r) => ({ ...r, customerName: nameById.get(r.customer_id) ?? "?" }))
    .sort(
      (a, b) =>
        a.customerName.localeCompare(b.customerName, "tr") ||
        (a.system ?? "").localeCompare(b.system ?? "", "tr"),
    );
}
