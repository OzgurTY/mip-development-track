import { addDays } from "./date";

/**
 * Kucuk bir iCalendar okuyucu. Yalnizca aday havuzu icin gereken alanlari
 * cikarir; tam RFC 5545 destegi hedeflenmez (feed'lerdeki tekrar kurallari
 * aday asamasinda kullanilmaz, insan takvime alirken kendisi tanimlar).
 */

export type ParsedIcsEvent = {
  uid: string;
  title: string;
  start: string | null;
  end: string | null;
  location: string | null;
  url: string | null;
  description: string | null;
};

/** Katlanmis satirlari birlestirir (devam satiri bosluk veya tab ile baslar). */
export function unfold(text: string): string[] {
  const lines = text.replace(/\r\n/g, "\n").replace(/\r/g, "\n").split("\n");
  const out: string[] = [];
  for (const line of lines) {
    if ((line.startsWith(" ") || line.startsWith("\t")) && out.length > 0) {
      out[out.length - 1] += line.slice(1);
    } else {
      out.push(line);
    }
  }
  return out;
}

export function unescapeText(value: string): string {
  return value
    .replace(/\\n/gi, "\n")
    .replace(/\\,/g, ",")
    .replace(/\\;/g, ";")
    .replace(/\\\\/g, "\\");
}

/** "20261012" veya "20261012T140000Z" -> "2026-10-12". */
export function icsDateToIso(value: string): string | null {
  const match = /^(\d{4})(\d{2})(\d{2})/.exec(value.trim());
  if (!match) return null;
  return `${match[1]}-${match[2]}-${match[3]}`;
}

type Property = { name: string; params: Record<string, string>; value: string };

function parseProperty(line: string): Property | null {
  const colon = line.indexOf(":");
  if (colon === -1) return null;
  const head = line.slice(0, colon);
  const value = line.slice(colon + 1);
  const [name, ...paramParts] = head.split(";");
  const params: Record<string, string> = {};
  for (const part of paramParts) {
    const eq = part.indexOf("=");
    if (eq > 0) params[part.slice(0, eq).toUpperCase()] = part.slice(eq + 1);
  }
  return { name: name.toUpperCase(), params, value };
}

export function parseIcs(text: string): ParsedIcsEvent[] {
  const lines = unfold(text);
  const events: ParsedIcsEvent[] = [];
  let current: Record<string, Property> | null = null;

  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed === "BEGIN:VEVENT") {
      current = {};
      continue;
    }
    if (trimmed === "END:VEVENT") {
      if (current) events.push(toEvent(current));
      current = null;
      continue;
    }
    if (!current) continue;
    const property = parseProperty(line);
    if (property) current[property.name] = property;
  }

  return events.filter((event) => event.title !== "" && event.start !== null);
}

function toEvent(props: Record<string, Property>): ParsedIcsEvent {
  const text = (name: string): string | null => {
    const value = props[name]?.value;
    return value ? unescapeText(value).trim() || null : null;
  };

  const start = props.DTSTART ? icsDateToIso(props.DTSTART.value) : null;
  let end = props.DTEND ? icsDateToIso(props.DTEND.value) : null;

  // Tam gun etkinlikte DTEND haric tutulur: bir gun geri alinir.
  if (end && props.DTEND?.params.VALUE === "DATE") {
    const inclusive = addDays(end, -1);
    end = start && inclusive < start ? start : inclusive;
  }

  return {
    uid: text("UID") ?? `${start ?? ""}-${text("SUMMARY") ?? ""}`,
    title: text("SUMMARY") ?? "",
    start,
    end,
    location: text("LOCATION"),
    url: text("URL"),
    description: text("DESCRIPTION"),
  };
}

/**
 * Serbest JSON listesinden aday cikarir. Konferans veri setleri farkli alan
 * adlari kullandigi icin yaygin adlar sirayla denenir.
 */
export function parseJsonFeed(payload: unknown): ParsedIcsEvent[] {
  const rows = Array.isArray(payload)
    ? payload
    : Array.isArray((payload as { events?: unknown })?.events)
      ? ((payload as { events: unknown[] }).events as unknown[])
      : [];

  const pick = (row: Record<string, unknown>, keys: string[]): string | null => {
    for (const key of keys) {
      const value = row[key];
      if (typeof value === "string" && value.trim() !== "") return value.trim();
    }
    return null;
  };

  return rows
    .filter((row): row is Record<string, unknown> => typeof row === "object" && row !== null)
    .map((row) => {
      const start = pick(row, ["startDate", "start_date", "start", "date"]);
      const title = pick(row, ["name", "title", "summary"]) ?? "";
      return {
        uid:
          pick(row, ["id", "uid", "slug"]) ??
          `${title}-${start ?? ""}`.toLowerCase(),
        title,
        start: start ? (icsDateToIso(start.replace(/-/g, "")) ?? start.slice(0, 10)) : null,
        end: (() => {
          const value = pick(row, ["endDate", "end_date", "end"]);
          if (!value) return null;
          return icsDateToIso(value.replace(/-/g, "")) ?? value.slice(0, 10);
        })(),
        location: pick(row, ["city", "location"]),
        url: pick(row, ["url", "link", "hyperlink", "website"]),
        description: pick(row, ["description", "topic"]),
        city: pick(row, ["city"]),
        country: pick(row, ["country"]),
      } as ParsedIcsEvent & { city: string | null; country: string | null };
    })
    .filter((event) => event.title !== "" && event.start !== null);
}
