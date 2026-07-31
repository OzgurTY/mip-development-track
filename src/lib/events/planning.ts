import { z } from "zod";

/**
 * Planlama bloklari: gorevler, maliyet, ekip, seyahat. Hepsi RowEditor ile
 * duzenlendigi icin alanlar string tutulur; sayisal degerler okunurken
 * `toAmount` ile cozulur.
 */

export const COST_KINDS = [
  "Sponsorluk",
  "Bilet",
  "Uçuş",
  "Konaklama",
  "Stand",
  "Diğer",
] as const;
export const COST_STATUSES = ["Tahmini", "Onaylı", "Ödendi"] as const;
export const CURRENCIES = ["TRY", "EUR", "USD", "GBP"] as const;
export const ATTENDEE_ROLES = [
  "Katılımcı",
  "Konuşmacı",
  "Stand",
  "Organizasyon",
] as const;
export const TASK_STATUSES = ["Bekliyor", "Devam ediyor", "Tamamlandı"] as const;
export const TRAVEL_KINDS = ["Uçuş", "Otel", "Transfer", "Diğer"] as const;
export const TRAVEL_STATUSES = ["Aday", "Seçildi", "Rezerve", "İptal"] as const;

const line = z.string().trim().max(300);
const day = z
  .string()
  .trim()
  .regex(/^(\d{4}-\d{2}-\d{2})?$/, "Tarih biçimi geçersiz");
const optionOf = (values: readonly string[]) =>
  z.string().trim().refine((v) => v === "" || values.includes(v), {
    message: "Geçersiz seçim",
  });

export const taskSchema = z.object({
  title: line,
  due_date: day,
  status: optionOf(TASK_STATUSES),
  assignee: line,
});

export const costSchema = z.object({
  kind: optionOf(COST_KINDS),
  label: line,
  amount: z.string().trim().max(20),
  currency: optionOf(CURRENCIES),
  status: optionOf(COST_STATUSES),
});

export const attendeeSchema = z.object({
  name: line,
  role: optionOf(ATTENDEE_ROLES),
  note: line,
});

export const travelSchema = z.object({
  kind: optionOf(TRAVEL_KINDS),
  name: line,
  person: line,
  check_in: day,
  check_out: day,
  price: z.string().trim().max(20),
  currency: optionOf(CURRENCIES),
  link: line,
  status: optionOf(TRAVEL_STATUSES),
});

export type EventTask = z.infer<typeof taskSchema>;
export type EventCost = z.infer<typeof costSchema>;
export type EventAttendee = z.infer<typeof attendeeSchema>;
export type EventTravel = z.infer<typeof travelSchema>;

export const planningSchema = z.object({
  tasks: z.array(taskSchema).max(60),
  costs: z.array(costSchema).max(60),
  attendees: z.array(attendeeSchema).max(60),
  travel: z.array(travelSchema).max(60),
});

export type PlanningDraft = z.infer<typeof planningSchema>;

export const EMPTY_TASK: EventTask = {
  title: "",
  due_date: "",
  status: "Bekliyor",
  assignee: "",
};
export const EMPTY_COST: EventCost = {
  kind: "",
  label: "",
  amount: "",
  currency: "EUR",
  status: "Tahmini",
};
export const EMPTY_ATTENDEE: EventAttendee = { name: "", role: "", note: "" };
export const EMPTY_TRAVEL: EventTravel = {
  kind: "",
  name: "",
  person: "",
  check_in: "",
  check_out: "",
  price: "",
  currency: "EUR",
  link: "",
  status: "Aday",
};

/**
 * Serbest yazilmis tutari sayiya cevirir. Hem "1200" hem "1.200,50" hem
 * "1,200.50" kabul edilir; cozulemezse 0 doner.
 */
export function toAmount(value: string): number {
  const cleaned = value.trim().replace(/[^\d.,-]/g, "");
  if (cleaned === "") return 0;

  const lastComma = cleaned.lastIndexOf(",");
  const lastDot = cleaned.lastIndexOf(".");
  let normalized: string;

  if (lastComma >= 0 && lastDot >= 0) {
    // Iki ayirici birlikte: sondaki ondaliktir.
    normalized =
      lastComma > lastDot
        ? cleaned.replace(/\./g, "").replace(",", ".")
        : cleaned.replace(/,/g, "");
  } else if (lastComma >= 0 || lastDot >= 0) {
    // Tek ayirici: "12.000" binlik, "1200.50" ondalik. Ayraçtan sonra tam
    // uc hane varsa ve tek grup degilse binlik kabul edilir.
    const sep = lastComma >= 0 ? "," : ".";
    const parts = cleaned.split(sep);
    const thousands =
      parts.length > 2 || parts.slice(1).every((part) => part.length === 3);
    normalized = thousands
      ? parts.join("")
      : cleaned.replace(sep, ".");
  } else {
    normalized = cleaned;
  }

  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : 0;
}

/** Para birimi bazinda toplam: cok dovizli listede tek sayiya indirgenmez. */
export function totalByCurrency(
  rows: { amount: string; currency: string }[],
): { currency: string; total: number }[] {
  const totals = new Map<string, number>();
  for (const row of rows) {
    const currency = row.currency || "TRY";
    totals.set(currency, (totals.get(currency) ?? 0) + toAmount(row.amount));
  }
  return [...totals.entries()]
    .filter(([, total]) => total !== 0)
    .map(([currency, total]) => ({ currency, total }))
    .sort((a, b) => b.total - a.total);
}

export function formatAmount(value: number, currency: string): string {
  return `${value.toLocaleString("tr-TR", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })} ${currency}`;
}

export function openTaskCount(tasks: EventTask[]): number {
  return tasks.filter((task) => task.status !== "Tamamlandı").length;
}
