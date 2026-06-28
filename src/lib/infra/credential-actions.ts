"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { encrypt } from "@/lib/crypto/secret";

export type CredState = { error: string } | { ok: true } | null;

export async function addCredential(
  entryId: string,
  _prev: CredState,
  formData: FormData,
): Promise<CredState> {
  const username = String(formData.get("username") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const role = String(formData.get("role") ?? "").trim();
  const note = String(formData.get("note") ?? "").trim();
  if (!username) return { error: "Kullanıcı adı gerekli" };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { error } = await supabase.from("infra_credentials").insert({
    entry_id: entryId,
    username,
    secret: password ? encrypt(password) : null,
    role: role || null,
    note: note || null,
    created_by: user?.id ?? null,
  });
  if (error) return { error: "Kimlik eklenemedi" };

  revalidatePath("/altyapi");
  return { ok: true };
}

export async function deleteCredential(
  id: string,
): Promise<{ error?: string }> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("infra_credentials")
    .delete()
    .eq("id", id);
  if (error) return { error: "Silme başarısız" };
  revalidatePath("/altyapi");
  return {};
}
