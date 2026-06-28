import { createClient } from "@/lib/supabase/server";
import { getFieldDefinitions } from "@/lib/fields/queries";
import { decrypt, isEncrypted } from "@/lib/crypto/secret";
import type { Attachment, Credential, InfraEntry, InfraField } from "./types";

export async function getInfraEntries(
  customerId: string,
): Promise<InfraEntry[]> {
  const supabase = await createClient();
  const [defs, rows, typeRows] = await Promise.all([
    getFieldDefinitions("infra"),
    supabase
      .from("infra_entries")
      .select("id, customer_id, type, label, notes, fields")
      .eq("customer_id", customerId)
      .order("created_at", { ascending: false }),
    supabase.from("infra_types").select("key, label"),
  ]);
  const typeLabels = new Map<string, string>();
  for (const t of typeRows.data ?? []) typeLabels.set(t.key, t.label);

  const entries: InfraEntry[] = (rows.data ?? []).map((row) => {
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
      typeLabel: typeLabels.get(row.type) ?? row.type,
      label: row.label,
      notes: row.notes,
      fields,
      attachments: [] as Attachment[],
      credentials: [] as Credential[],
    };
  });

  const entryIds = entries.map((e) => e.id);
  if (entryIds.length > 0) {
    const { data: atts } = await supabase
      .from("infra_attachments")
      .select("id, entry_id, file_path, file_name")
      .in("entry_id", entryIds);

    const paths = (atts ?? []).map((a) => a.file_path);
    const signed = paths.length
      ? ((await supabase.storage.from("infra-files").createSignedUrls(paths, 3600))
          .data ?? [])
      : [];
    const urlByPath = new Map<string, string>();
    signed.forEach((s) => {
      if (s.path && s.signedUrl) urlByPath.set(s.path, s.signedUrl);
    });

    const byEntry = new Map<string, Attachment[]>();
    for (const a of atts ?? []) {
      const list = byEntry.get(a.entry_id) ?? [];
      list.push({
        id: a.id,
        name: a.file_name,
        url: urlByPath.get(a.file_path) ?? null,
      });
      byEntry.set(a.entry_id, list);
    }
    for (const e of entries) e.attachments = byEntry.get(e.id) ?? [];

    const { data: creds } = await supabase
      .from("infra_credentials")
      .select("id, entry_id, username, secret, role, note")
      .in("entry_id", entryIds)
      .order("sort_order");
    const credByEntry = new Map<string, Credential[]>();
    for (const c of creds ?? []) {
      let secret: string | null = null;
      if (c.secret != null) {
        if (isEncrypted(c.secret)) {
          try {
            secret = decrypt(c.secret);
          } catch {
            secret = "(çözülemedi)";
          }
        } else {
          secret = String(c.secret);
        }
      }
      const list = credByEntry.get(c.entry_id) ?? [];
      list.push({
        id: c.id,
        username: c.username,
        secret,
        role: c.role,
        note: c.note,
      });
      credByEntry.set(c.entry_id, list);
    }
    for (const e of entries) e.credentials = credByEntry.get(e.id) ?? [];
  }

  return entries;
}
