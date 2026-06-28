import { createClient } from "@/lib/supabase/server";
import { normalizeOptions } from "./options";
import type { FieldDefinition } from "./types";

export async function getFieldDefinitions(
  entity: string,
  group?: string,
): Promise<FieldDefinition[]> {
  const supabase = await createClient();
  let query = supabase
    .from("field_definitions")
    .select(
      "id, entity, key, label, type, options, required, is_sensitive, sort_order, group:field_group",
    )
    .eq("entity", entity)
    .order("sort_order");
  if (group !== undefined) query = query.eq("field_group", group);
  const { data } = await query;

  return (data ?? []).map((d) => ({
    ...d,
    options: normalizeOptions(d.options),
  })) as FieldDefinition[];
}
