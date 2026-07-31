import { createClient } from "@/lib/supabase/server";
import type { EventCandidate, EventSource } from "./source-types";

export async function getEventSources(): Promise<EventSource[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("event_sources")
    .select(
      "id, label, kind, url, is_active, default_status, last_synced_at, last_error",
    )
    .order("label");
  return (data ?? []) as EventSource[];
}

export async function getCandidates(): Promise<EventCandidate[]> {
  const supabase = await createClient();
  const [{ data }, sources] = await Promise.all([
    supabase
      .from("event_candidates")
      .select(
        "id, source_id, external_uid, title, start_date, end_date, city, country, url, status, event_id",
      )
      .order("start_date", { ascending: true }),
    getEventSources(),
  ]);
  const labels = new Map(sources.map((source) => [source.id, source.label]));
  return ((data ?? []) as Omit<EventCandidate, "sourceLabel">[]).map((row) => ({
    ...row,
    sourceLabel: labels.get(row.source_id) ?? "Bilinmeyen kaynak",
  }));
}
