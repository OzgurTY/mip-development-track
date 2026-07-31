import type {
  MonthlyMode,
  Recurrence,
  RepeatFreq,
} from "@/lib/calendar/recurrence";
import type {
  EventAttendee,
  EventCost,
  EventTask,
  EventTravel,
} from "./planning";

export const EVENT_STATUSES = [
  "aday",
  "degerlendiriliyor",
  "onaylandi",
  "tamamlandi",
  "iptal",
  "bilgi",
] as const;
export type EventStatus = (typeof EVENT_STATUSES)[number];

export const STATUS_LABEL: Record<EventStatus, string> = {
  aday: "Aday",
  degerlendiriliyor: "Değerlendiriliyor",
  onaylandi: "Onaylandı",
  tamamlandi: "Tamamlandı",
  iptal: "İptal",
  bilgi: "Bilgi",
};

/**
 * Karar bekleyen durumlar: takvimde ayri bir kartta toplanir.
 * "bilgi" bilincli olarak disarida: resmi tatil gibi kayitlar icin
 * verilecek bir karar yoktur.
 */
export const PENDING_STATUSES: EventStatus[] = ["aday", "degerlendiriliyor"];

/** Bizim etkinligimiz mi, yoksa yalnizca takvimde duran bir bilgi mi. */
export function isInformational(status: string): boolean {
  return status === "bilgi";
}

export const PARTICIPATIONS = [
  "izleyici",
  "konusmaci",
  "sponsor",
  "stand",
  "duzenleyici",
] as const;
export type Participation = (typeof PARTICIPATIONS)[number];

export const PARTICIPATION_LABEL: Record<Participation, string> = {
  izleyici: "İzleyici",
  konusmaci: "Konuşmacı",
  sponsor: "Sponsor",
  stand: "Stand",
  duzenleyici: "Düzenleyici",
};

export type EventType = {
  key: string;
  label: string;
  color: string;
  sort_order: number;
};

export type EventRecord = {
  id: string;
  title: string;
  type: string | null;
  status: EventStatus;
  participation: string | null;

  start_date: string;
  end_date: string | null;
  start_time: string | null;
  end_time: string | null;
  timezone: string | null;

  is_online: boolean;
  city: string | null;
  country: string | null;
  venue: string | null;
  website: string | null;

  deadline_date: string | null;
  customer_id: string | null;
  owner_id: string | null;

  summary: string | null;
  outcome: string | null;
  custom_fields: Record<string, unknown>;

  repeat_freq: RepeatFreq | null;
  repeat_interval: number;
  repeat_weekdays: number[];
  repeat_monthly_mode: MonthlyMode;
  repeat_until: string | null;
  repeat_count: number | null;
  repeat_skip_dates: string[];

  tasks: EventTask[];
  costs: EventCost[];
  attendees: EventAttendee[];
  travel: EventTravel[];

  updated_at: string;
};

/** Kayittaki tekrar alanlarini takvim cekirdeginin bekledigi bicime cevirir. */
export function recurrenceOf(record: EventRecord): Recurrence {
  return {
    freq: record.repeat_freq,
    interval: record.repeat_interval,
    weekdays: record.repeat_weekdays,
    monthlyMode: record.repeat_monthly_mode,
    until: record.repeat_until,
    count: record.repeat_count,
    skipDates: record.repeat_skip_dates,
  };
}

/** Takvim ve listelerde kullanilan, adlari cozulmus kayit. */
export type EventItem = EventRecord & {
  typeLabel: string;
  typeColor: string;
  customerName: string | null;
  ownerName: string | null;
};

export type OwnerOption = { id: string; name: string };

/** Etkinligin bittigi gun: end_date bossa tek gunluk sayilir. */
export function eventEnd(item: Pick<EventRecord, "start_date" | "end_date">): string {
  const end = item.end_date;
  return end && end > item.start_date ? end : item.start_date;
}

export function locationLabel(
  item: Pick<EventRecord, "is_online" | "city" | "country" | "venue">,
): string | null {
  if (item.is_online) return "Çevrimiçi";
  const parts = [item.city, item.country].filter(
    (part): part is string => Boolean(part && part.trim()),
  );
  if (parts.length > 0) return parts.join(", ");
  return item.venue?.trim() || null;
}
