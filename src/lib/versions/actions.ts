"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { getFieldDefinitions } from "@/lib/fields/queries";
import { buildCustomFieldsSchema } from "@/lib/fields/schema";

export type SaveState = { error: string } | { ok: true } | null;

const coreSchema = z.object({
  system: z.string().trim().max(120).optional(),
  deployment: z.string().trim().max(120).optional(),
  os: z.string().trim().max(120).optional(),
  status: z.string().trim().max(120).optional(),
  middleware: z.string().trim().max(120).optional(),
  package: z.string().trim().max(120).optional(),
});

function safeJson(value: string): string[] {
  try {
    const p = JSON.parse(value);
    return Array.isArray(p) ? p.map(String) : [];
  } catch {
    return [];
  }
}

export async function saveVersionRecord(
  recordId: string | null,
  customerId: string,
  _prev: SaveState,
  formData: FormData,
): Promise<SaveState> {
  const core = coreSchema.safeParse({
    system: formData.get("system") ?? "",
    deployment: formData.get("deployment") ?? "",
    os: formData.get("os") ?? "",
    status: formData.get("status") ?? "",
    middleware: formData.get("middleware") ?? "",
    package: formData.get("package") ?? "",
  });
  if (!core.success) return { error: "Geçersiz giriş" };

  const defs = await getFieldDefinitions("version");
  const raw: Record<string, unknown> = {};
  for (const def of defs) {
    const value = formData.get(`cf_${def.key}`);
    if (value === null || value === "") continue;
    raw[def.key] =
      def.type === "multiselect" && typeof value === "string"
        ? safeJson(value)
        : value;
  }
  const cf = buildCustomFieldsSchema(defs).safeParse(raw);
  if (!cf.success) {
    return { error: cf.error.issues[0]?.message ?? "Özel alan geçersiz" };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const payload = {
    customer_id: customerId,
    system: core.data.system || null,
    deployment: core.data.deployment || null,
    os: core.data.os || null,
    status: core.data.status || null,
    middleware: core.data.middleware || null,
    package: core.data.package || null,
    custom_fields: cf.data,
    updated_at: new Date().toISOString(),
    updated_by: user?.id ?? null,
  };
  const query = recordId
    ? supabase.from("version_records").update(payload).eq("id", recordId)
    : supabase.from("version_records").insert(payload);
  const { error } = await query;
  if (error) return { error: "Kayıt başarısız" };

  revalidatePath("/surumler");
  return { ok: true };
}

export async function deleteVersionRecord(
  id: string,
): Promise<{ error?: string }> {
  const supabase = await createClient();
  const { error } = await supabase.from("version_records").delete().eq("id", id);
  if (error) return { error: "Silme başarısız" };
  revalidatePath("/surumler");
  return {};
}

export async function saveComponentLatest(
  key: string,
  _prev: SaveState,
  formData: FormData,
): Promise<SaveState> {
  const latest = String(formData.get("latest_version") ?? "").trim();
  const supabase = await createClient();
  const { error } = await supabase
    .from("component_latest")
    .update({
      latest_version: latest || null,
      updated_at: new Date().toISOString(),
    })
    .eq("key", key);
  if (error) return { error: "Güncellenemedi" };
  revalidatePath("/surumler");
  return { ok: true };
}
