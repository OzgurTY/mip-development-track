import { createClient } from "@/lib/supabase/server";
import type { InfraType } from "./types";

export async function getInfraTypes(): Promise<InfraType[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("infra_types")
    .select("id, key, label, sort_order")
    .order("sort_order");
  return (data ?? []) as InfraType[];
}
