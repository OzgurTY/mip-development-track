import type { Cell } from "./types";

function pad(n: number): string {
  return String(n).padStart(2, "0");
}

// Tarihler UTC bileşenleriyle biçimlenir: exceljs tarih-hücrelerini UTC gece
// yarısı Date olarak döndürür; UTC getter'lar makine saat dilimine bağımsız
// doğru takvim gününü verir.
export function formatDate(d: Date): string {
  return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`;
}

const DMY = /(\d{1,2})[./](\d{1,2})[./](\d{4})/;

export function parseWeekDate(cell: Cell): string | null {
  if (cell instanceof Date) return formatDate(cell);
  if (typeof cell === "string") {
    const m = cell.match(DMY);
    if (m) return `${m[3]}-${pad(Number(m[2]))}-${pad(Number(m[1]))}`;
  }
  return null;
}

// MIP Version tarih-tiplidir. Date ise ISO; içinde GG.AA.YYYY olan karışık
// string ise o tarih; aksi halde temizlenmiş string (kayıpsız).
export function parseMipDate(cell: Cell): string | null {
  if (cell instanceof Date) return formatDate(cell);
  if (typeof cell === "string") {
    const m = cell.match(DMY);
    if (m) return `${m[3]}-${pad(Number(m[2]))}-${pad(Number(m[1]))}`;
    const t = cell.trim();
    return t || null;
  }
  return null;
}

export function cleanText(cell: Cell): string | null {
  if (cell instanceof Date) return formatDate(cell);
  if (cell === null || cell === undefined) return null;
  const s = String(cell).trim();
  return s || null;
}

// Bileşen sürümleri kirli string olarak korunur (spec: "diğer sürümler string
// kalır"); yalnız trim. "yok" da olduğu gibi kalır (drift bunu kurulu-değil sayar).
export const cleanVersion = cleanText;

// Haftalık hücre: boş veya "X" => güncelleme yok; metin => güncelleme gövdesi.
export function isUpdateBody(cell: Cell): string | null {
  const s = cleanText(cell);
  if (s === null) return null;
  if (s.toUpperCase() === "X") return null;
  return s;
}

const DEPLOY_KNOWN = new Set([
  "OnPremise",
  "Cloud-Logosoft",
  "Cloud-Bulutistan",
]);

export function normalizeDeployment(cell: Cell): {
  value: string | null;
  flag?: string;
} {
  const s = cleanText(cell);
  if (s === null || s === "?") return { value: null };
  if (s === "OnPremise - Clouda geçecek") return { value: "OnPremise" };
  if (DEPLOY_KNOWN.has(s)) return { value: s };
  return { value: s, flag: s };
}

export function normalizeStatus(cell: Cell): string | null {
  const s = cleanText(cell);
  if (s === null || s === "?" || s === ".") return null;
  return s;
}

export function normalizeDbType(cell: Cell): string | null {
  const s = cleanText(cell);
  if (s === null) return null;
  if (s.toLowerCase() === "postgres") return "Postgres";
  return s;
}
