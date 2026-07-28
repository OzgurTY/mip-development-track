"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { DEFAULT_GENERAL_CRITERIA, DEFAULT_WORKS, newProcess } from "./defaults";
import { pocDraftSchema } from "./schema";

export type CreateState = { error: string } | { ok: true; id: string } | null;
export type SaveResult = { error?: string };

/** Bos string kolonlari null'a cevirir; jsonb dizileri oldugu gibi kalir. */
function nullable(value: string): string | null {
  const trimmed = value.trim();
  return trimmed === "" ? null : trimmed;
}

const createSchema = z.object({
  customerName: z.string().trim().min(1, "Müşteri adı zorunlu").max(200),
  title: z.string().trim().min(1, "Başlık zorunlu").max(200),
});

/**
 * PoC'ler cogunlukla sistemde kayitli olmayan aday firmalar icin yapiliyor.
 * Ad kayitli bir musteriyle birebir eslesirse baglanti kurulur, eslesmezse
 * kayit yalnizca serbest metin adla yasar.
 */
async function resolveCustomerId(
  supabase: Awaited<ReturnType<typeof createClient>>,
  name: string,
): Promise<string | null> {
  const { data } = await supabase
    .from("customers")
    .select("id")
    .ilike("name", name)
    .limit(1)
    .maybeSingle();
  return data ? String(data.id) : null;
}

export async function createPoc(formData: FormData): Promise<CreateState> {
  const parsed = createSchema.safeParse({
    customerName: formData.get("customerName") ?? "",
    title: formData.get("title") ?? "",
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Geçersiz giriş" };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const customerId = await resolveCustomerId(supabase, parsed.data.customerName);

  const { data, error } = await supabase
    .from("poc_records")
    .insert({
      customer_id: customerId,
      customer_name: parsed.data.customerName,
      title: parsed.data.title,
      status: "Planlandı",
      works: DEFAULT_WORKS,
      criteria: DEFAULT_GENERAL_CRITERIA,
      processes: [newProcess()],
      created_by: user?.id ?? null,
      updated_by: user?.id ?? null,
    })
    .select("id")
    .single();

  if (error || !data) return { error: "PoC oluşturulamadı" };

  revalidatePath("/poc");
  return { ok: true, id: String(data.id) };
}

export async function savePoc(
  id: string,
  draft: unknown,
): Promise<SaveResult> {
  const parsed = pocDraftSchema.safeParse(draft);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Geçersiz içerik" };
  }
  const d = parsed.data;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  // Ad duzenlenmis olabilir: kayitli musteri baglantisini her kayitta tazele.
  const customerId = await resolveCustomerId(supabase, d.customer_name);

  const { error } = await supabase
    .from("poc_records")
    .update({
      customer_id: customerId,
      customer_name: d.customer_name,
      title: d.title,
      status: d.status || "Planlandı",
      result: nullable(d.result),
      start_date: nullable(d.start_date),
      end_date: nullable(d.end_date),
      deployment: nullable(d.deployment),
      team_mdp: nullable(d.team_mdp),
      team_customer: nullable(d.team_customer),
      purpose: nullable(d.purpose),
      out_of_scope: nullable(d.out_of_scope),
      server_info: nullable(d.server_info),
      os_info: nullable(d.os_info),
      mip_version: nullable(d.mip_version),
      install_date: nullable(d.install_date),
      access_note: nullable(d.access_note),
      install_result: nullable(d.install_result),
      processes: d.processes,
      works: d.works,
      criteria: d.criteria,
      updated_at: new Date().toISOString(),
      updated_by: user?.id ?? null,
    })
    .eq("id", id);

  if (error) return { error: "Kayıt başarısız" };

  revalidatePath("/poc");
  revalidatePath(`/poc/${id}`);
  return {};
}

export async function deletePoc(id: string): Promise<SaveResult> {
  const supabase = await createClient();
  const { error } = await supabase.from("poc_records").delete().eq("id", id);
  if (error) return { error: "Silme başarısız" };
  revalidatePath("/poc");
  return {};
}
