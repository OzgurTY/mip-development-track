import { createClient } from "@/lib/supabase/server";
import { normalizeOptions } from "./options";
import type { FieldDefinition } from "./types";

export async function getFieldDefinitions(
  entity: string,
): Promise<FieldDefinition[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("field_definitions")
    .select(
      "id, entity, key, label, type, options, required, is_sensitive, sort_order",
    )
    .eq("entity", entity)
    .order("sort_order");

  return (data ?? []).map((d) => ({
    ...d,
    options: normalizeOptions(d.options),
  })) as FieldDefinition[];
}
