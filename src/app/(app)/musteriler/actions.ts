"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { customerInputSchema } from "@/lib/validation/customer";
import { slugify } from "@/lib/utils/slug";

export type CreateState = { error: string } | { ok: true } | null;

export async function createCustomer(
  _prev: CreateState,
  formData: FormData,
): Promise<CreateState> {
  const parsed = customerInputSchema.safeParse({ name: formData.get("name") });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Geçersiz giriş" };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("customers").insert({
    name: parsed.data.name,
    slug: slugify(parsed.data.name),
    is_active: parsed.data.is_active,
  });
  if (error) {
    return {
      error: error.code === "23505" ? "Bu müşteri zaten var" : "Kayıt başarısız",
    };
  }

  revalidatePath("/musteriler");
  return { ok: true };
}

export async function deleteCustomer(id: string): Promise<{ error?: string }> {
  const supabase = await createClient();
  const { error } = await supabase.from("customers").delete().eq("id", id);
  if (error) {
    return { error: "Silme başarısız" };
  }
  revalidatePath("/musteriler");
  return {};
}
