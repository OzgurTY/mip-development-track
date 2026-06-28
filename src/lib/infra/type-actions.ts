"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { slugify } from "@/lib/utils/slug";

export type TypeState = { error: string } | { ok: true } | null;

export async function createInfraType(
  _prev: TypeState,
  formData: FormData,
): Promise<TypeState> {
  const label = String(formData.get("label") ?? "").trim();
  if (!label) return { error: "Tip adı gerekli" };
  const key = slugify(label).replace(/-/g, "_") || `tip_${Date.now()}`;

  const supabase = await createClient();
  const { data: max } = await supabase
    .from("infra_types")
    .select("sort_order")
    .order("sort_order", { ascending: false })
    .limit(1)
    .maybeSingle();
  const nextOrder = (max?.sort_order ?? 0) + 1;

  const { error } = await supabase
    .from("infra_types")
    .insert({ key, label, sort_order: nextOrder });
  if (error) {
    return {
      error: error.code === "23505" ? "Bu tip zaten var" : "Kayıt başarısız",
    };
  }
  revalidatePath("/yonetim/alanlar");
  revalidatePath("/altyapi");
  return { ok: true };
}

export async function deleteInfraType(id: string): Promise<{ error?: string }> {
  const supabase = await createClient();
  const { error } = await supabase.from("infra_types").delete().eq("id", id);
  if (error) return { error: "Silme başarısız" };
  revalidatePath("/yonetim/alanlar");
  revalidatePath("/altyapi");
  return {};
}
