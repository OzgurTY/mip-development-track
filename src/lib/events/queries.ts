import { createClient } from "@/lib/supabase/server";
import {
  attendeeSchema,
  costSchema,
  taskSchema,
  travelSchema,
} from "./planning";
import type {
  EventItem,
  EventRecord,
  EventStatus,
  EventType,
  OwnerOption,
} from "./types";

const COLUMNS =
  "id, title, type, status, participation, start_date, end_date, start_time, " +
  "end_time, timezone, is_online, city, country, venue, website, " +
  "deadline_date, customer_id, owner_id, summary, outcome, custom_fields, " +
  "repeat_freq, repeat_interval, repeat_weekdays, repeat_monthly_mode, " +
  "repeat_until, repeat_count, repeat_skip_dates, " +
  "tasks, costs, attendees, travel, updated_at";

export async function getEventTypes(): Promise<EventType[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("event_types")
    .select("key, label, color, sort_order")
    .order("sort_order");
  return (data ?? []) as EventType[];
}

export async function getOwnerOptions(): Promise<OwnerOption[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("profiles")
    .select("id, full_name, email")
    .order("full_name");
  return (data ?? []).map((row) => ({
    id: String(row.id),
    name: (row.full_name as string | null) ?? String(row.email ?? ""),
  }));
}

type RawEvent = Record<string, unknown>;

/** jsonb dizisini semaya uyan satirlara indirger; bozuk satiri atar. */
function parseRows<T>(schema: { safeParse: (v: unknown) => { success: boolean; data?: T } }, value: unknown): T[] {
  if (!Array.isArray(value)) return [];
  const out: T[] = [];
  for (const item of value) {
    const parsed = schema.safeParse(item);
    if (parsed.success && parsed.data) out.push(parsed.data);
  }
  return out;
}

function toRecord(row: RawEvent): EventRecord {
  const str = (key: string) => (row[key] as string | null) ?? null;
  return {
    id: String(row.id),
    title: String(row.title ?? ""),
    type: str("type"),
    status: (row.status as EventStatus) ?? "aday",
    participation: str("participation"),
    start_date: String(row.start_date ?? ""),
    end_date: str("end_date"),
    start_time: str("start_time"),
    end_time: str("end_time"),
    timezone: str("timezone"),
    is_online: row.is_online === true,
    city: str("city"),
    country: str("country"),
    venue: str("venue"),
    website: str("website"),
    deadline_date: str("deadline_date"),
    customer_id: str("customer_id"),
    owner_id: str("owner_id"),
    summary: str("summary"),
    outcome: str("outcome"),
    custom_fields:
      (row.custom_fields as Record<string, unknown> | null) ?? {},
    repeat_freq: (row.repeat_freq as EventRecord["repeat_freq"]) ?? null,
    repeat_interval: Number(row.repeat_interval ?? 1) || 1,
    repeat_weekdays: Array.isArray(row.repeat_weekdays)
      ? (row.repeat_weekdays as unknown[]).map(Number).filter((n) => n >= 0 && n <= 6)
      : [],
    repeat_monthly_mode:
      row.repeat_monthly_mode === "hafta_gunu" ? "hafta_gunu" : "gun",
    repeat_until: str("repeat_until"),
    repeat_count: row.repeat_count === null || row.repeat_count === undefined
      ? null
      : Number(row.repeat_count),
    repeat_skip_dates: Array.isArray(row.repeat_skip_dates)
      ? (row.repeat_skip_dates as unknown[]).map(String)
      : [],
    tasks: parseRows(taskSchema, row.tasks),
    costs: parseRows(costSchema, row.costs),
    attendees: parseRows(attendeeSchema, row.attendees),
    travel: parseRows(travelSchema, row.travel),
    updated_at: String(row.updated_at ?? ""),
  };
}

/**
 * Adlari cozulmus etkinlik listesi. Musteri ve sorumlu adlari ayri sorgudan
 * eslenir: events tablosunda profiles'a uc ayri FK var (owner/created/updated),
 * gomulu join bu yuzden belirsiz kalir.
 */
function decorate(
  records: EventRecord[],
  types: EventType[],
  customers: Map<string, string>,
  owners: Map<string, string>,
): EventItem[] {
  const typeMap = new Map(types.map((t) => [t.key, t]));
  return records.map((record) => {
    const type = record.type ? typeMap.get(record.type) : undefined;
    return {
      ...record,
      typeLabel: type?.label ?? "Tip yok",
      typeColor: type?.color ?? "var(--muted-foreground)",
      customerName: record.customer_id
        ? (customers.get(record.customer_id) ?? null)
        : null,
      ownerName: record.owner_id ? (owners.get(record.owner_id) ?? null) : null,
    };
  });
}

async function loadLookups(): Promise<{
  types: EventType[];
  customers: Map<string, string>;
  owners: Map<string, string>;
}> {
  const supabase = await createClient();
  const [types, customersResult, owners] = await Promise.all([
    getEventTypes(),
    supabase.from("customers").select("id, name"),
    getOwnerOptions(),
  ]);
  return {
    types,
    customers: new Map(
      (customersResult.data ?? []).map((c) => [String(c.id), String(c.name)]),
    ),
    owners: new Map(owners.map((o) => [o.id, o.name])),
  };
}

/**
 * Tum etkinlikler. Ic arac olcegi (yilda onlarca kayit) icin tamami cekilir;
 * ay gezinmesi istemcide filtreleme ile yapilir, her ay degisiminde sunucuya
 * gidilmez.
 */
export async function getEvents(): Promise<EventItem[]> {
  const supabase = await createClient();
  const [{ data }, lookups] = await Promise.all([
    supabase.from("events").select(COLUMNS).order("start_date"),
    loadLookups(),
  ]);
  const records = ((data ?? []) as unknown as RawEvent[]).map(toRecord);
  return decorate(records, lookups.types, lookups.customers, lookups.owners);
}

export async function getEvent(id: string): Promise<EventItem | null> {
  const supabase = await createClient();
  const [{ data }, lookups] = await Promise.all([
    supabase.from("events").select(COLUMNS).eq("id", id).maybeSingle(),
    loadLookups(),
  ]);
  if (!data) return null;
  const [item] = decorate(
    [toRecord(data as unknown as RawEvent)],
    lookups.types,
    lookups.customers,
    lookups.owners,
  );
  return item;
}
