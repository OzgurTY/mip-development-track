"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { customerInputSchema } from "@/lib/validation/customer";
import { slugify } from "@/lib/utils/slug";
import { getFieldDefinitions } from "@/lib/fields/queries";
import { buildCustomFieldsSchema } from "@/lib/fields/schema";

export type CreateState = { error: string } | { ok: true } | null;

function collectCustomFields(
  formData: FormData,
  keys: string[],
): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const key of keys) {
    const raw = formData.get(`cf_${key}`);
    if (raw === null || raw === "") continue;
    out[key] = raw;
  }
  return out;
}

async function parseCustomFields(formData: FormData) {
  const defs = await getFieldDefinitions("customer");
  const raw = collectCustomFields(
    formData,
    defs.map((d) => d.key),
  );
  for (const def of defs) {
    if (def.type === "multiselect" && typeof raw[def.key] === "string") {
      try {
        raw[def.key] = JSON.parse(raw[def.key] as string);
      } catch {
        raw[def.key] = [];
      }
    }
  }
  return buildCustomFieldsSchema(defs).safeParse(raw);
}

export async function createCustomer(
  _prev: CreateState,
  formData: FormData,
): Promise<CreateState> {
  const parsed = customerInputSchema.safeParse({
    name: formData.get("name"),
    is_active: formData.get("is_active") === "true",
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Geçersiz giriş" };
  }

  const cfResult = await parseCustomFields(formData);
  if (!cfResult.success) {
    return { error: cfResult.error.issues[0]?.message ?? "Özel alan geçersiz" };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("customers").insert({
    name: parsed.data.name,
    slug: slugify(parsed.data.name),
    is_active: parsed.data.is_active,
    custom_fields: cfResult.data,
  });
  if (error) {
    return {
      error: error.code === "23505" ? "Bu müşteri zaten var" : "Kayıt başarısız",
    };
  }

  revalidatePath("/musteriler");
  return { ok: true };
}

export async function updateCustomer(
  id: string,
  _prev: CreateState,
  formData: FormData,
): Promise<CreateState> {
  const parsed = customerInputSchema.safeParse({
    name: formData.get("name"),
    is_active: formData.get("is_active") === "true",
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Geçersiz giriş" };
  }

  const cfResult = await parseCustomFields(formData);
  if (!cfResult.success) {
    return { error: cfResult.error.issues[0]?.message ?? "Özel alan geçersiz" };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("customers")
    .update({
      name: parsed.data.name,
      is_active: parsed.data.is_active,
      custom_fields: cfResult.data,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);
  if (error) {
    return {
      error: error.code === "23505" ? "Bu müşteri zaten var" : "Kayıt başarısız",
    };
  }

  revalidatePath("/musteriler");
  revalidatePath(`/musteriler/${id}`);
  return { ok: true };
}

export async function deleteCustomer(id: string): Promise<{ error?: string }> {
  const supabase = await createClient();
  const { error } = await supabase.from("customers").delete().eq("id", id);
  if (error) return { error: "Silme başarısız" };
  revalidatePath("/musteriler");
  return {};
}
