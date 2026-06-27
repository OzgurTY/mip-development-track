import { createClient } from "@/lib/supabase/server";
import { getFieldDefinitions } from "@/lib/fields/queries";
import { decrypt, isEncrypted } from "@/lib/crypto/secret";
import type { InfraEntry, InfraField } from "./types";

export async function getInfraEntries(
  customerId: string,
): Promise<InfraEntry[]> {
  const supabase = await createClient();
  const [defs, rows] = await Promise.all([
    getFieldDefinitions("infra"),
    supabase
      .from("infra_entries")
      .select("id, customer_id, type, label, notes, fields")
      .eq("customer_id", customerId)
      .order("created_at", { ascending: false }),
  ]);

  return (rows.data ?? []).map((row) => {
    const stored = (row.fields ?? {}) as Record<string, unknown>;
    const fields: InfraField[] = defs
      .filter((d) => stored[d.key] !== undefined && stored[d.key] !== null)
      .map((d) => {
        const raw = stored[d.key];
        let value: string;
        if (d.is_sensitive && isEncrypted(raw)) {
          try {
            value = decrypt(raw);
          } catch {
            value = "(çözülemedi)";
          }
        } else {
          value = String(raw);
        }
        return { key: d.key, label: d.label, value, sensitive: d.is_sensitive };
      });
    return {
      id: row.id,
      customer_id: row.customer_id,
      type: row.type,
      label: row.label,
      notes: row.notes,
      fields,
    };
  });
}
