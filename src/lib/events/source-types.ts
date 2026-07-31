/**
 * Kaynak katmaninin saf parcalari: tipler, sabitler ve dogrulama.
 * Sunucuya ozel sorgular `sources.ts` icinde; istemci bilesenleri bu dosyayi
 * kullanir, boylece supabase sunucu istemcisi tarayici paketine girmez.
 */

/**
 * Tek islemde islenecek aday sayisi ust siniri. Kullaniciyi saymaya
 * zorlamamak icin yuksek tutulur; sunucu bunu 100'luk parcalara boler.
 */
export const BULK_LIMIT = 1000;

/** Tek sorguda gonderilecek satir sayisi (URL ve istek boyu siniri icin). */
export const CHUNK_SIZE = 100;

export function chunk<T>(items: T[], size: number = CHUNK_SIZE): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < items.length; i += size) out.push(items.slice(i, i + size));
  return out;
}

export type EventSource = {
  id: string;
  label: string;
  kind: "ics" | "json";
  url: string;
  is_active: boolean;
  /** Bu kaynaktan takvime alinanlarin varsayilan durumu. */
  default_status: "aday" | "bilgi";
  last_synced_at: string | null;
  last_error: string | null;
};

export type EventCandidate = {
  id: string;
  source_id: string;
  sourceLabel: string;
  external_uid: string;
  title: string;
  start_date: string | null;
  end_date: string | null;
  city: string | null;
  country: string | null;
  url: string | null;
  status: "yeni" | "takvime_alindi" | "gizlendi";
  event_id: string | null;
};

/**
 * Sunucudan disari cikan istekleri sinirla: yalnizca https ve yerel/ozel ag
 * disi adresler. Kaynak tanimini yalnizca admin yapabilse de, sunucu
 * uzerinden ic aga istek atilmasini engeller.
 */
export function isAllowedFeedUrl(raw: string): boolean {
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    return false;
  }
  if (url.protocol !== "https:") return false;

  const host = url.hostname.toLowerCase();
  if (host === "localhost" || host.endsWith(".localhost")) return false;
  if (host === "[::1]" || host === "::1") return false;
  if (/^127\./.test(host)) return false;
  if (/^10\./.test(host)) return false;
  if (/^192\.168\./.test(host)) return false;
  if (/^169\.254\./.test(host)) return false;
  if (/^172\.(1[6-9]|2\d|3[01])\./.test(host)) return false;
  return true;
}
