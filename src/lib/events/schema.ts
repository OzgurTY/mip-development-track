import { z } from "zod";
import { REPEAT_FREQS } from "@/lib/calendar/recurrence";
import { EVENT_STATUSES, PARTICIPATIONS } from "./types";

const line = z.string().trim().max(300);
const paragraph = z.string().trim().max(4000);
const day = z
  .string()
  .trim()
  .regex(/^(\d{4}-\d{2}-\d{2})?$/, "Tarih biçimi geçersiz");
const clock = z
  .string()
  .trim()
  .regex(/^(\d{2}:\d{2}(:\d{2})?)?$/, "Saat biçimi geçersiz");

const optionOf = (values: readonly string[]) =>
  z.string().trim().refine((v) => v === "" || values.includes(v), {
    message: "Geçersiz seçim",
  });

const uuidOrEmpty = z
  .string()
  .trim()
  .refine((v) => v === "" || /^[0-9a-f-]{36}$/i.test(v), {
    message: "Geçersiz kayıt",
  });

export const eventInputSchema = z
  .object({
    title: z.string().trim().min(1, "Başlık zorunlu").max(200),
    type: line,
    status: optionOf(EVENT_STATUSES),
    participation: optionOf(PARTICIPATIONS),

    start_date: z
      .string()
      .trim()
      .regex(/^\d{4}-\d{2}-\d{2}$/, "Başlangıç tarihi zorunlu"),
    end_date: day,
    start_time: clock,
    end_time: clock,
    timezone: line,

    is_online: z.boolean(),
    city: line,
    country: line,
    venue: line,
    website: line,

    deadline_date: day,
    customer_id: uuidOrEmpty,
    owner_id: uuidOrEmpty,

    summary: paragraph,
    outcome: paragraph,

    repeat_freq: optionOf(REPEAT_FREQS),
    repeat_interval: z.coerce.number().int().min(1).max(52),
    repeat_weekdays: z.array(z.coerce.number().int().min(0).max(6)).max(7),
    repeat_monthly_mode: optionOf(["gun", "hafta_gunu"]),
    repeat_end_mode: optionOf(["yok", "tarih", "sayi"]),
    repeat_until: day,
    repeat_count: z.union([z.coerce.number().int().min(1).max(400), z.literal("")]),
  })
  .refine((v) => v.end_date === "" || v.end_date >= v.start_date, {
    message: "Bitiş tarihi başlangıçtan önce olamaz",
    path: ["end_date"],
  })
  .refine(
    (v) =>
      v.repeat_freq === "" ||
      v.repeat_end_mode !== "tarih" ||
      (v.repeat_until !== "" && v.repeat_until >= v.start_date),
    {
      message: "Tekrar bitiş tarihi başlangıçtan sonra olmalı",
      path: ["repeat_until"],
    },
  )
  .refine(
    (v) =>
      v.repeat_freq === "" || v.repeat_end_mode !== "sayi" || v.repeat_count !== "",
    { message: "Tekrar sayısı girilmeli", path: ["repeat_count"] },
  );

export type EventInput = z.infer<typeof eventInputSchema>;

/** Formdan gelen alanlari sema girdisine cevirir. */
export function readEventForm(formData: FormData): Record<string, unknown> {
  const text = (key: string) => String(formData.get(key) ?? "");
  return {
    title: text("title"),
    type: text("type"),
    status: text("status"),
    participation: text("participation"),
    start_date: text("start_date"),
    end_date: text("end_date"),
    start_time: text("start_time"),
    end_time: text("end_time"),
    timezone: text("timezone"),
    is_online: formData.get("is_online") === "true",
    city: text("city"),
    country: text("country"),
    venue: text("venue"),
    website: text("website"),
    deadline_date: text("deadline_date"),
    customer_id: text("customer_id"),
    owner_id: text("owner_id"),
    summary: text("summary"),
    outcome: text("outcome"),
    repeat_freq: text("repeat_freq"),
    repeat_interval: text("repeat_interval") || 1,
    repeat_weekdays: formData.getAll("repeat_weekdays").map(String),
    repeat_monthly_mode: text("repeat_monthly_mode") || "gun",
    repeat_end_mode: text("repeat_end_mode") || "yok",
    repeat_until: text("repeat_until"),
    repeat_count: text("repeat_count"),
  };
}
