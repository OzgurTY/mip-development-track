"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { slugify } from "@/lib/utils/slug";
import { normalizeOptions } from "@/lib/fields/options";

const fieldDefSchema = z.object({
  entity: z.enum(["customer", "track", "version", "infra"]),
  label: z.string().trim().min(1, "Etiket zorunlu").max(120),
  type: z.enum([
    "text",
    "textarea",
    "number",
    "date",
    "boolean",
    "select",
    "multiselect",
  ]),
  options: z.array(z.string()),
  required: z.boolean(),
});

export type FieldDefState = { error: string } | { ok: true } | null;

function revalidateModules() {
  for (const p of [
    "/yonetim/alanlar",
    "/musteriler",
    "/takip",
    "/surumler",
    "/altyapi",
  ]) {
    revalidatePath(p);
  }
}

export async function createFieldDefinition(
  _prev: FieldDefState,
  formData: FormData,
): Promise<FieldDefState> {
  const parsed = fieldDefSchema.safeParse({
    entity: formData.get("entity"),
    label: formData.get("label"),
    type: formData.get("type"),
    options: normalizeOptions(String(formData.get("options") ?? "").split("\n")),
    required:
      formData.get("required") === "on" || formData.get("required") === "true",
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Geçersiz giriş" };
  }
  if (
    (parsed.data.type === "select" || parsed.data.type === "multiselect") &&
    parsed.data.options.length === 0
  ) {
    return { error: "Seçmeli alan için en az bir seçenek gerekli" };
  }

  const key =
    slugify(parsed.data.label).replace(/-/g, "_") || `alan_${Date.now()}`;

  const supabase = await createClient();
  const { error } = await supabase.from("field_definitions").insert({
    entity: parsed.data.entity,
    key,
    label: parsed.data.label,
    type: parsed.data.type,
    options: parsed.data.options,
    required: parsed.data.required,
  });
  if (error) {
    return {
      error: error.code === "23505" ? "Bu anahtar zaten var" : "Kayıt başarısız",
    };
  }

  revalidateModules();
  return { ok: true };
}

export async function deleteFieldDefinition(
  id: string,
): Promise<{ error?: string }> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("field_definitions")
    .delete()
    .eq("id", id);
  if (error) return { error: "Silme başarısız" };
  revalidateModules();
  return {};
}
