"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type UploadState = { error: string } | { ok: true } | null;

const MAX_BYTES = 20 * 1024 * 1024; // 20 MB

function safeName(name: string): string {
  return name.replace(/[^a-zA-Z0-9._-]+/g, "_").slice(0, 120) || "dosya";
}

export async function uploadAttachment(
  entryId: string,
  _prev: UploadState,
  formData: FormData,
): Promise<UploadState> {
  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return { error: "Dosya seçilmedi" };
  }
  if (file.size > MAX_BYTES) {
    return { error: "Dosya 20 MB sınırını aşıyor" };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const clean = safeName(file.name);
  const path = `${entryId}/${crypto.randomUUID()}-${clean}`;
  const up = await supabase.storage
    .from("infra-files")
    .upload(path, file, { contentType: file.type || undefined, upsert: false });
  if (up.error) return { error: "Yükleme başarısız" };

  const { error } = await supabase.from("infra_attachments").insert({
    entry_id: entryId,
    file_path: path,
    file_name: clean,
    mime: file.type || null,
    size: file.size,
    uploaded_by: user?.id ?? null,
  });
  if (error) {
    await supabase.storage.from("infra-files").remove([path]);
    return { error: "Kayıt başarısız" };
  }

  revalidatePath("/altyapi");
  return { ok: true };
}

export async function deleteAttachment(
  id: string,
): Promise<{ error?: string }> {
  const supabase = await createClient();
  const { data: row } = await supabase
    .from("infra_attachments")
    .select("file_path")
    .eq("id", id)
    .single();
  if (row?.file_path) {
    await supabase.storage.from("infra-files").remove([row.file_path]);
  }
  const { error } = await supabase
    .from("infra_attachments")
    .delete()
    .eq("id", id);
  if (error) return { error: "Silme başarısız" };
  revalidatePath("/altyapi");
  return {};
}
