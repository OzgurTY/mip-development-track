"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { getFieldDefinitions } from "@/lib/fields/queries";
import { encrypt } from "@/lib/crypto/secret";

export type SaveState = { error: string } | { ok: true } | null;

const schema = z.object({
  type: z.enum(["sunucu", "mip", "baglanti", "vpn", "diger"]),
  label: z.string().trim().min(1, "Etiket zorunlu").max(200),
  notes: z.string().trim().max(2000).optional(),
});

export async function saveInfraEntry(
  customerId: string,
  _prev: SaveState,
  formData: FormData,
): Promise<SaveState> {
  const parsed = schema.safeParse({
    type: formData.get("type"),
    label: formData.get("label"),
    notes: formData.get("notes") ?? "",
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Geçersiz giriş" };
  }

  const defs = await getFieldDefinitions("infra");
  const fields: Record<string, unknown> = {};
  for (const def of defs) {
    const value = formData.get(`cf_${def.key}`);
    if (value === null || value === "") continue;
    const str = String(value);
    fields[def.key] = def.is_sensitive ? encrypt(str) : str;
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { error } = await supabase.from("infra_entries").insert({
    customer_id: customerId,
    type: parsed.data.type,
    label: parsed.data.label,
    notes: parsed.data.notes || null,
    fields,
    created_by: user?.id ?? null,
  });
  if (error) return { error: "Kayıt başarısız" };

  revalidatePath("/altyapi");
  return { ok: true };
}

export async function deleteInfraEntry(id: string): Promise<{ error?: string }> {
  const supabase = await createClient();
  const { error } = await supabase.from("infra_entries").delete().eq("id", id);
  if (error) return { error: "Silme başarısız" };
  revalidatePath("/altyapi");
  return {};
}
