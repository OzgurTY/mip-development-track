"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

// The file bytes are uploaded directly from the browser to Supabase Storage
// (authenticated client, Storage RLS enforced), so they never pass through a
// Server Action body. This action only records the metadata row.
export async function recordAttachment(
  entryId: string,
  filePath: string,
  fileName: string,
  mime: string | null,
  size: number,
): Promise<{ error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { error } = await supabase.from("infra_attachments").insert({
    entry_id: entryId,
    file_path: filePath,
    file_name: fileName,
    mime,
    size,
    uploaded_by: user?.id ?? null,
  });
  if (error) {
    // Roll back the uploaded object so we don't leave an orphan.
    await supabase.storage.from("infra-files").remove([filePath]);
    return { error: "Kayıt başarısız" };
  }
  revalidatePath("/altyapi");
  return {};
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
