"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { parseIcs, parseJsonFeed } from "@/lib/calendar/ics-parse";
import { BULK_LIMIT, chunk, isAllowedFeedUrl } from "./source-types";

export type SourceState = { error: string } | { ok: true } | null;
export type ActionResult = { error?: string };
export type SyncResult = { error?: string; fetched?: number; added?: number };

const FETCH_TIMEOUT_MS = 15_000;

const sourceSchema = z.object({
  label: z.string().trim().min(1, "Ad zorunlu").max(120),
  kind: z.enum(["ics", "json"]),
  default_status: z.enum(["aday", "bilgi"]),
  url: z
    .string()
    .trim()
    .refine(isAllowedFeedUrl, "Yalnızca https adresleri kabul edilir"),
});

export async function createEventSource(
  _prev: SourceState,
  formData: FormData,
): Promise<SourceState> {
  const parsed = sourceSchema.safeParse({
    label: formData.get("label"),
    kind: formData.get("kind"),
    default_status: formData.get("default_status") ?? "aday",
    url: formData.get("url"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Geçersiz giriş" };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("event_sources").insert(parsed.data);
  if (error) return { error: "Kaynak eklenemedi" };

  revalidatePath("/yonetim/etkinlik-kaynaklari");
  return { ok: true };
}

export async function deleteEventSource(id: string): Promise<ActionResult> {
  const supabase = await createClient();
  const { error } = await supabase.from("event_sources").delete().eq("id", id);
  if (error) return { error: "Kaynak silinemedi" };
  revalidatePath("/yonetim/etkinlik-kaynaklari");
  revalidatePath("/takvim");
  return {};
}

/**
 * Kaynagi tarar ve aday havuzunu gunceller. Idempotent: ayni etkinlik
 * (source_id, external_uid) ile tekillestirilir, var olan aday ezilmez.
 */
export async function syncEventSource(sourceId: string): Promise<SyncResult> {
  const supabase = await createClient();
  const { data: source } = await supabase
    .from("event_sources")
    .select("id, kind, url")
    .eq("id", sourceId)
    .maybeSingle();
  if (!source) return { error: "Kaynak bulunamadı" };

  const url = String(source.url);
  if (!isAllowedFeedUrl(url)) return { error: "Adres izinli değil" };

  let fetched: ReturnType<typeof parseIcs> = [];
  try {
    const response = await fetch(url, {
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
      headers: { "User-Agent": "MIP-Development-Track/1.0" },
      cache: "no-store",
    });
    if (!response.ok) {
      await recordError(sourceId, `HTTP ${response.status}`);
      return { error: `Kaynak yanıt vermedi (HTTP ${response.status})` };
    }
    const body = await response.text();
    fetched =
      source.kind === "json" ? parseJsonFeed(safeJson(body)) : parseIcs(body);
  } catch (error: unknown) {
    const message =
      error instanceof Error && error.name === "TimeoutError"
        ? "Zaman aşımı"
        : "Bağlantı hatası";
    await recordError(sourceId, message);
    return { error: `Tarama başarısız: ${message}` };
  }

  const rows = fetched
    .filter((item) => item.start)
    .slice(0, 500)
    .map((item) => ({
      source_id: sourceId,
      external_uid: item.uid.slice(0, 300),
      title: item.title.slice(0, 300),
      start_date: item.start,
      end_date: item.end,
      city:
        (item as { city?: string | null }).city ?? item.location?.slice(0, 120) ?? null,
      country: (item as { country?: string | null }).country ?? null,
      url: item.url,
      raw: item as unknown as Record<string, unknown>,
    }));

  let added = 0;
  if (rows.length > 0) {
    // ignoreDuplicates: daha once gizlenmis veya takvime alinmis aday geri
    // gelmesin, insanin verdigi karar korunur.
    const { data, error } = await supabase
      .from("event_candidates")
      .upsert(rows, {
        onConflict: "source_id,external_uid",
        ignoreDuplicates: true,
      })
      .select("id");
    if (error) {
      await recordError(sourceId, "Kayıt hatası");
      return { error: "Adaylar kaydedilemedi" };
    }
    added = data?.length ?? 0;
  }

  await supabase
    .from("event_sources")
    .update({ last_synced_at: new Date().toISOString(), last_error: null })
    .eq("id", sourceId);

  revalidatePath("/yonetim/etkinlik-kaynaklari");
  revalidatePath("/takvim");
  return { fetched: rows.length, added };
}

async function recordError(sourceId: string, message: string): Promise<void> {
  const supabase = await createClient();
  await supabase
    .from("event_sources")
    .update({ last_synced_at: new Date().toISOString(), last_error: message })
    .eq("id", sourceId);
  revalidatePath("/yonetim/etkinlik-kaynaklari");
}

const defaultStatusCache = new Map<string, "aday" | "bilgi">();

/** Kaynagin varsayilan durumu; ayni istekte tekrar sorgulanmaz. */
async function sourceDefaultStatus(
  sourceId: string,
): Promise<"aday" | "bilgi"> {
  const cached = defaultStatusCache.get(sourceId);
  if (cached) return cached;
  const supabase = await createClient();
  const { data } = await supabase
    .from("event_sources")
    .select("default_status")
    .eq("id", sourceId)
    .maybeSingle();
  const value = data?.default_status === "bilgi" ? "bilgi" : "aday";
  defaultStatusCache.set(sourceId, value);
  return value;
}

/** Bu kaynaktan takvime alinmis etkinlikleri siler (adaylar kalir). */
export async function deleteSourceEvents(
  sourceId: string,
): Promise<{ error?: string; removed?: number }> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("event_candidates")
    .select("id, event_id")
    .eq("source_id", sourceId)
    .not("event_id", "is", null);

  const ids = (data ?? [])
    .map((row) => row.event_id)
    .filter((id): id is string => Boolean(id));
  if (ids.length === 0) return { removed: 0 };

  for (const part of chunk(ids)) {
    const { error } = await supabase.from("events").delete().in("id", part);
    if (error) return { error: "Etkinlikler silinemedi" };
  }

  const candidateIds = (data ?? []).map((row) => String(row.id));
  for (const part of chunk(candidateIds)) {
    await supabase
      .from("event_candidates")
      .update({ status: "yeni", event_id: null })
      .in("id", part);
  }

  revalidatePath("/takvim");
  revalidatePath("/yonetim/etkinlik-kaynaklari");
  return { removed: ids.length };
}

function safeJson(body: string): unknown {
  try {
    return JSON.parse(body);
  } catch {
    return [];
  }
}

/** Adayi takvime alir: aday durumunda gercek bir etkinlik olusturur. */
export async function promoteCandidate(
  candidateId: string,
): Promise<{ error?: string; eventId?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: candidate } = await supabase
    .from("event_candidates")
    .select("id, source_id, title, start_date, end_date, city, country, url, status")
    .eq("id", candidateId)
    .maybeSingle();
  if (!candidate) return { error: "Aday bulunamadı" };
  if (candidate.status === "takvime_alindi") {
    return { error: "Bu aday zaten takvime alınmış" };
  }
  const status = await sourceDefaultStatus(String(candidate.source_id));

  const { data: created, error } = await supabase
    .from("events")
    .insert({
      title: String(candidate.title),
      status,
      start_date: candidate.start_date,
      end_date: candidate.end_date,
      city: candidate.city,
      country: candidate.country,
      website: candidate.url,
      created_by: user?.id ?? null,
      updated_by: user?.id ?? null,
    })
    .select("id")
    .single();
  if (error || !created) return { error: "Etkinlik oluşturulamadı" };

  await supabase
    .from("event_candidates")
    .update({ status: "takvime_alindi", event_id: created.id })
    .eq("id", candidateId);

  revalidatePath("/takvim");
  return { eventId: String(created.id) };
}

export async function setCandidateStatus(
  candidateId: string,
  status: "yeni" | "gizlendi",
): Promise<ActionResult> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("event_candidates")
    .update({ status })
    .eq("id", candidateId);
  if (error) return { error: "Güncellenemedi" };
  revalidatePath("/takvim");
  return {};
}

/**
 * Coklu takvime alma. Etkinlik id'leri sunucuda uretilir; boylece olusan
 * kayitlar adaylarla tek sorguda eslesir, sira tahminine dayanmaz.
 */
export async function promoteCandidates(
  ids: string[],
  /** Bos ise her adayin kaynagindaki varsayilan durum kullanilir. */
  status?: "aday" | "bilgi",
): Promise<{ error?: string; added?: number }> {
  if (ids.length === 0) return { added: 0 };
  if (ids.length > BULK_LIMIT) {
    return { error: `Tek seferde en fazla ${BULK_LIMIT} aday alınabilir` };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let added = 0;
  // Parcali islenir: tek sorguya binlerce id sigmaz, kullanici da saymak
  // zorunda kalmaz.
  for (const part of chunk(ids)) {
    const { data: candidates } = await supabase
      .from("event_candidates")
      .select(
        "id, source_id, external_uid, title, start_date, end_date, city, country, url",
      )
      .in("id", part)
      .neq("status", "takvime_alindi");
    if (!candidates || candidates.length === 0) continue;

    const pairs = await Promise.all(
      candidates.map(async (candidate) => ({
        candidate,
        eventId: crypto.randomUUID(),
        status:
          status ?? (await sourceDefaultStatus(String(candidate.source_id))),
      })),
    );

    const { error: insertError } = await supabase.from("events").insert(
      pairs.map(({ candidate, eventId, status: rowStatus }) => ({
        id: eventId,
        title: String(candidate.title),
        status: rowStatus,
        start_date: candidate.start_date,
        end_date: candidate.end_date,
        city: candidate.city,
        country: candidate.country,
        website: candidate.url,
        created_by: user?.id ?? null,
        updated_by: user?.id ?? null,
      })),
    );
    if (insertError) {
      return added > 0
        ? { error: `${added} etkinlik alındı, kalanında hata oluştu`, added }
        : { error: "Etkinlikler oluşturulamadı" };
    }

    const { error: updateError } = await supabase
      .from("event_candidates")
      .upsert(
        pairs.map(({ candidate, eventId }) => ({
          id: candidate.id,
          source_id: candidate.source_id,
          external_uid: candidate.external_uid,
          title: candidate.title,
          status: "takvime_alindi",
          event_id: eventId,
        })),
        { onConflict: "id" },
      );
    if (updateError) return { error: "Adaylar güncellenemedi", added };

    added += pairs.length;
  }

  if (added === 0) return { error: "Alınacak aday bulunamadı" };

  revalidatePath("/takvim");
  return { added };
}

/** Coklu gizleme veya geri alma. */
export async function setCandidateStatuses(
  ids: string[],
  status: "yeni" | "gizlendi",
): Promise<ActionResult> {
  if (ids.length === 0) return {};
  const supabase = await createClient();
  for (const part of chunk(ids)) {
    const { error } = await supabase
      .from("event_candidates")
      .update({ status })
      .in("id", part)
      .neq("status", "takvime_alindi");
    if (error) return { error: "Güncellenemedi" };
  }
  revalidatePath("/takvim");
  return {};
}
