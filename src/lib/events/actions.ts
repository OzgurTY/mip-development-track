"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { planningSchema } from "./planning";
import { eventInputSchema, readEventForm } from "./schema";
import { EVENT_STATUSES } from "./types";

export type SaveState = { error: string } | { ok: true; id: string } | null;
export type ActionResult = { error?: string };

function nullable(value: string): string | null {
  const trimmed = value.trim();
  return trimmed === "" ? null : trimmed;
}

export async function saveEvent(
  eventId: string | null,
  _prev: SaveState,
  formData: FormData,
): Promise<SaveState> {
  const parsed = eventInputSchema.safeParse(readEventForm(formData));
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Geçersiz giriş" };
  }
  const v = parsed.data;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const payload = {
    title: v.title,
    type: nullable(v.type),
    status: v.status || "aday",
    participation: nullable(v.participation),
    start_date: v.start_date,
    end_date: nullable(v.end_date),
    start_time: nullable(v.start_time),
    end_time: nullable(v.end_time),
    timezone: nullable(v.timezone),
    is_online: v.is_online,
    city: nullable(v.city),
    country: nullable(v.country),
    venue: nullable(v.venue),
    website: nullable(v.website),
    deadline_date: nullable(v.deadline_date),
    customer_id: nullable(v.customer_id),
    owner_id: nullable(v.owner_id),
    summary: nullable(v.summary),
    outcome: nullable(v.outcome),

    // Tekrar kurali: frekans yoksa tum tekrar alanlari temizlenir ki eski
    // kural kaydin uzerinde takili kalmasin.
    repeat_freq: nullable(v.repeat_freq),
    repeat_interval: v.repeat_freq ? v.repeat_interval : 1,
    repeat_weekdays:
      v.repeat_freq === "haftalik" && v.repeat_weekdays.length > 0
        ? v.repeat_weekdays
        : null,
    repeat_monthly_mode:
      v.repeat_freq === "aylik" ? v.repeat_monthly_mode || "gun" : null,
    repeat_until:
      v.repeat_freq && v.repeat_end_mode === "tarih"
        ? nullable(v.repeat_until)
        : null,
    repeat_count:
      v.repeat_freq && v.repeat_end_mode === "sayi" && v.repeat_count !== ""
        ? Number(v.repeat_count)
        : null,

    updated_at: new Date().toISOString(),
    updated_by: user?.id ?? null,
  };

  if (eventId) {
    const { error } = await supabase
      .from("events")
      .update(payload)
      .eq("id", eventId);
    if (error) return { error: "Kayıt başarısız" };
    revalidatePath("/takvim");
    revalidatePath(`/takvim/${eventId}`);
    return { ok: true, id: eventId };
  }

  const { data, error } = await supabase
    .from("events")
    .insert({ ...payload, created_by: user?.id ?? null })
    .select("id")
    .single();
  if (error || !data) return { error: "Etkinlik oluşturulamadı" };

  revalidatePath("/takvim");
  return { ok: true, id: String(data.id) };
}

export async function setEventStatus(
  id: string,
  status: string,
): Promise<ActionResult> {
  if (!(EVENT_STATUSES as readonly string[]).includes(status)) {
    return { error: "Geçersiz durum" };
  }
  const supabase = await createClient();
  const { error } = await supabase
    .from("events")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", id);
  if (error) return { error: "Durum güncellenemedi" };
  revalidatePath("/takvim");
  revalidatePath(`/takvim/${id}`);
  return {};
}

export async function deleteEvent(id: string): Promise<ActionResult> {
  const supabase = await createClient();
  const { error } = await supabase.from("events").delete().eq("id", id);
  if (error) return { error: "Silme başarısız" };
  revalidatePath("/takvim");
  return {};
}

// --- Etkinlik tipleri (yalniz admin; RLS de ayni kurali zorlar) -------------

const typeSchema = z.object({
  key: z
    .string()
    .trim()
    .min(1, "Anahtar zorunlu")
    .max(40)
    .regex(/^[a-z0-9_]+$/, "Anahtar yalnızca küçük harf, sayı ve _ içerebilir"),
  label: z.string().trim().min(1, "Etiket zorunlu").max(80),
  color: z.string().trim().min(1).max(80),
});

export async function createEventType(
  _prev: SaveState,
  formData: FormData,
): Promise<SaveState> {
  const parsed = typeSchema.safeParse({
    key: formData.get("key"),
    label: formData.get("label"),
    color: formData.get("color"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Geçersiz giriş" };
  }

  const supabase = await createClient();
  const { count } = await supabase
    .from("event_types")
    .select("key", { count: "exact", head: true });

  const { error } = await supabase.from("event_types").insert({
    ...parsed.data,
    sort_order: (count ?? 0) + 1,
  });
  if (error) {
    return {
      error: /duplicate/i.test(error.message)
        ? "Bu anahtar zaten var."
        : "Tip eklenemedi.",
    };
  }
  revalidatePath("/yonetim/etkinlik-tipleri");
  revalidatePath("/takvim");
  return { ok: true, id: parsed.data.key };
}

export async function deleteEventType(key: string): Promise<ActionResult> {
  const supabase = await createClient();
  // Tip silinince etkinlikler silinmez; type alani null'a duser (FK set null).
  const { error } = await supabase.from("event_types").delete().eq("key", key);
  if (error) return { error: "Tip silinemedi" };
  revalidatePath("/yonetim/etkinlik-tipleri");
  revalidatePath("/takvim");
  return {};
}

/**
 * Planlama bloklarini (gorevler, maliyet, ekip, seyahat) tek seferde kaydeder.
 * Etkinligin kunye alanlarina dokunmaz.
 */
export async function saveEventPlanning(
  eventId: string,
  draft: unknown,
): Promise<ActionResult> {
  const parsed = planningSchema.safeParse(draft);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Geçersiz içerik" };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { error } = await supabase
    .from("events")
    .update({
      tasks: parsed.data.tasks,
      costs: parsed.data.costs,
      attendees: parsed.data.attendees,
      travel: parsed.data.travel,
      updated_at: new Date().toISOString(),
      updated_by: user?.id ?? null,
    })
    .eq("id", eventId);
  if (error) return { error: "Kayıt başarısız" };

  revalidatePath("/takvim");
  revalidatePath(`/takvim/${eventId}`);
  return {};
}

/**
 * Seriden tek bir tekrari cikarir. Serinin kendisi bozulmaz; tarih
 * repeat_skip_dates listesine eklenir.
 */
export async function skipOccurrence(
  eventId: string,
  date: string,
): Promise<ActionResult> {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return { error: "Geçersiz tarih" };

  const supabase = await createClient();
  const { data } = await supabase
    .from("events")
    .select("repeat_skip_dates")
    .eq("id", eventId)
    .maybeSingle();
  if (!data) return { error: "Etkinlik bulunamadı" };

  const current = Array.isArray(data.repeat_skip_dates)
    ? (data.repeat_skip_dates as unknown[]).map(String)
    : [];
  if (current.includes(date)) return {};

  const { error } = await supabase
    .from("events")
    .update({
      repeat_skip_dates: [...current, date].sort(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", eventId);
  if (error) return { error: "Tekrar çıkarılamadı" };

  revalidatePath("/takvim");
  revalidatePath(`/takvim/${eventId}`);
  return {};
}

/** Cikarilan bir tekrari geri alir. */
export async function restoreOccurrence(
  eventId: string,
  date: string,
): Promise<ActionResult> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("events")
    .select("repeat_skip_dates")
    .eq("id", eventId)
    .maybeSingle();
  if (!data) return { error: "Etkinlik bulunamadı" };

  const current = Array.isArray(data.repeat_skip_dates)
    ? (data.repeat_skip_dates as unknown[]).map(String)
    : [];

  const { error } = await supabase
    .from("events")
    .update({
      repeat_skip_dates: current.filter((value) => value !== date),
      updated_at: new Date().toISOString(),
    })
    .eq("id", eventId);
  if (error) return { error: "Geri alınamadı" };

  revalidatePath("/takvim");
  revalidatePath(`/takvim/${eventId}`);
  return {};
}
