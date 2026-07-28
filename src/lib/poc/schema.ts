import { z } from "zod";
import {
  CRITERION_STATUSES,
  POC_RESULTS,
  POC_STATUSES,
  TEST_RESULTS,
  WORK_STATUSES,
} from "./types";

const line = z.string().trim().max(300);
const paragraph = z.string().trim().max(4000);
const day = z
  .string()
  .trim()
  .regex(/^(\d{4}-\d{2}-\d{2})?$/, "Tarih biçimi geçersiz");

/** Bos string kabul eden sinirli secim: kullanici alani bos birakabilir. */
const optionOf = (values: readonly string[]) =>
  z.string().trim().refine((v) => v === "" || values.includes(v), {
    message: "Geçersiz seçim",
  });

export const criterionSchema = z.object({
  text: line,
  status: optionOf(CRITERION_STATUSES),
  note: line,
});

export const processSchema = z.object({
  name: line,
  source: line,
  target: line,
  method: line,
  sent: z.string().trim().max(20),
  ok: z.string().trim().max(20),
  failed: z.string().trim().max(20),
  result: optionOf(TEST_RESULTS),
  criteria: z.array(criterionSchema).max(40).default([]),
});

export const workSchema = z.object({
  name: line,
  status: optionOf(WORK_STATUSES),
  date: day,
});

const rows = <T extends z.ZodTypeAny>(schema: T) => z.array(schema).max(60);

export const pocDraftSchema = z.object({
  customer_name: z.string().trim().min(1, "Müşteri adı zorunlu").max(200),
  title: z.string().trim().min(1, "Başlık zorunlu").max(200),
  status: optionOf(POC_STATUSES),
  result: optionOf(POC_RESULTS),

  start_date: day,
  end_date: day,
  deployment: line,
  team_mdp: line,
  team_customer: line,

  purpose: paragraph,
  out_of_scope: paragraph,

  server_info: line,
  os_info: line,
  mip_version: line,
  install_date: day,
  access_note: paragraph,
  install_result: line,

  processes: rows(processSchema),
  works: rows(workSchema),
  criteria: rows(criterionSchema),
});

export type PocDraft = z.infer<typeof pocDraftSchema>;

/** jsonb kolonlarindan gelen degeri guvenli sekilde tiplendirir. */
export function parseRows<T>(schema: z.ZodType<T>, value: unknown): T[] {
  if (!Array.isArray(value)) return [];
  const out: T[] = [];
  for (const item of value) {
    const parsed = schema.safeParse(item);
    if (parsed.success) out.push(parsed.data);
  }
  return out;
}
