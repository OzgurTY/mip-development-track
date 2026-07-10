"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { getFieldDefinitions } from "@/lib/fields/queries";
import { buildCustomFieldsSchema } from "@/lib/fields/schema";
import { TRACK_STATUSES } from "./types";

export type SaveState = { error: string } | { ok: true } | null;

const recordSchema = z.object({
  status: z.union([z.enum(TRACK_STATUSES), z.literal("")]).optional(),
  project: z.string().trim().max(500).optional(),
  scope: z.string().trim().max(2000).optional(),
  lead: z.string().trim().max(200).optional(),
  responsibles: z.string().trim().max(500).optional(),
});

function safeJson(value: string): string[] {
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed.map(String) : [];
  } catch {
    return [];
  }
}

export async function saveTrackRecord(
  customerId: string,
  _prev: SaveState,
  formData: FormData,
): Promise<SaveState> {
  const parsed = recordSchema.safeParse({
    status: formData.get("status") ?? "",
    project: formData.get("project") ?? "",
    scope: formData.get("scope") ?? "",
    lead: formData.get("lead") ?? "",
    responsibles: formData.get("responsibles") ?? "",
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Geçersiz giriş" };
  }

  const defs = await getFieldDefinitions("track");
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
  const { error } = await supabase.from("track_records").upsert(
    {
      customer_id: customerId,
      status: parsed.data.status || null,
      project: parsed.data.project || null,
      scope: parsed.data.scope || null,
      lead: parsed.data.lead || null,
      responsibles: parsed.data.responsibles || null,
      custom_fields: cf.data,
      updated_at: new Date().toISOString(),
      updated_by: user?.id ?? null,
    },
    { onConflict: "customer_id" },
  );
  if (error) return { error: "Kayıt başarısız" };

  revalidatePath("/takip");
  revalidatePath("/takip/toplanti");
  return { ok: true };
}

export async function deleteTrackRecord(
  customerId: string,
): Promise<{ error?: string }> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("track_records")
    .delete()
    .eq("customer_id", customerId);
  if (error) return { error: "Silme başarısız" };

  revalidatePath("/takip");
  revalidatePath("/takip/toplanti");
  return {};
}

export async function setTrackStatus(
  customerId: string,
  status: string,
): Promise<{ error?: string }> {
  if (!TRACK_STATUSES.includes(status as (typeof TRACK_STATUSES)[number])) {
    return { error: "Geçersiz durum" };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  // Upsert on conflict yalnızca verilen kolonları günceller; diğer takip
  // alanlarına dokunmaz. RLS engellerse 0 satır döner; select ile yakalıyoruz.
  const { data, error } = await supabase
    .from("track_records")
    .upsert(
      {
        customer_id: customerId,
        status,
        updated_at: new Date().toISOString(),
        updated_by: user?.id ?? null,
      },
      { onConflict: "customer_id" },
    )
    .select("customer_id");
  if (error || !data?.length) return { error: "Durum güncellenemedi" };

  revalidatePath("/takip");
  revalidatePath("/takip/toplanti");
  return {};
}

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

export async function addTrackUpdate(
  customerId: string,
  _prev: SaveState,
  formData: FormData,
): Promise<SaveState> {
  const body = String(formData.get("body") ?? "").trim();
  const weekDate = String(formData.get("week_date") ?? "").trim();
  if (!body) return { error: "Güncelleme metni gerekli" };
  if (!weekDate) return { error: "Tarih gerekli" };
  if (!ISO_DATE.test(weekDate)) return { error: "Geçersiz tarih" };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { error } = await supabase.from("track_updates").insert({
    customer_id: customerId,
    week_date: weekDate,
    body,
    author_id: user?.id ?? null,
  });
  if (error) return { error: "Güncelleme eklenemedi" };

  revalidatePath("/takip");
  revalidatePath("/takip/toplanti");
  return { ok: true };
}

export async function editTrackUpdate(
  updateId: string,
  _prev: SaveState,
  formData: FormData,
): Promise<SaveState> {
  const body = String(formData.get("body") ?? "").trim();
  const weekDate = String(formData.get("week_date") ?? "").trim();
  if (!body) return { error: "Güncelleme metni gerekli" };
  if (!weekDate) return { error: "Tarih gerekli" };
  if (!ISO_DATE.test(weekDate)) return { error: "Geçersiz tarih" };

  const supabase = await createClient();
  // RLS engellerse hata yerine 0 satır döner; select ile yakalıyoruz.
  const { data, error } = await supabase
    .from("track_updates")
    .update({ week_date: weekDate, body })
    .eq("id", updateId)
    .select("id");
  if (error || !data?.length) return { error: "Güncelleme kaydedilemedi" };

  revalidatePath("/takip");
  revalidatePath("/takip/toplanti");
  return { ok: true };
}

export async function deleteTrackUpdate(
  updateId: string,
): Promise<{ error?: string }> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("track_updates")
    .delete()
    .eq("id", updateId)
    .select("id");
  if (error || !data?.length) return { error: "Silme başarısız" };

  revalidatePath("/takip");
  revalidatePath("/takip/toplanti");
  return {};
}
