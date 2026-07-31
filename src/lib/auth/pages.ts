import type { Role } from "./roles";

export const PAGE_KEYS = [
  "genel",
  "musteriler",
  "takip",
  "surumler",
  "poc",
  "takvim",
  "altyapi",
  "yonetim",
] as const;

export type PageKey = (typeof PAGE_KEYS)[number];

export type AppPage = {
  key: PageKey;
  href: string;
  label: string;
  /** Sayfayi acabilmek icin gereken en dusuk rol. */
  minRole: Role;
};

/**
 * Uygulamadaki sayfalarin tek kaynagi: navigasyon, sayfa muhafizlari ve
 * yonetimdeki sayfa erisimi listesi hep buradan beslenir.
 */
export const APP_PAGES: AppPage[] = [
  { key: "genel", href: "/", label: "Genel Bakış", minRole: "viewer" },
  { key: "musteriler", href: "/musteriler", label: "Müşteriler", minRole: "viewer" },
  { key: "takip", href: "/takip", label: "Takip", minRole: "viewer" },
  { key: "surumler", href: "/surumler", label: "Sürümler", minRole: "viewer" },
  { key: "poc", href: "/poc", label: "PoC", minRole: "viewer" },
  { key: "takvim", href: "/takvim", label: "Takvim", minRole: "viewer" },
  { key: "altyapi", href: "/altyapi", label: "Altyapı", minRole: "editor" },
  { key: "yonetim", href: "/yonetim", label: "Yönetim", minRole: "admin" },
];

const RANK: Record<Role, number> = { viewer: 0, editor: 1, admin: 2 };

export function isPageKey(value: unknown): value is PageKey {
  return typeof value === "string" && (PAGE_KEYS as readonly string[]).includes(value);
}

export function roleAllowsPage(role: Role, key: PageKey): boolean {
  const page = APP_PAGES.find((p) => p.key === key);
  if (!page) return false;
  return RANK[role] >= RANK[page.minRole];
}

/** Rolun yapisal olarak gorebilecegi sayfalar (kisi bazli kisitlama haric). */
export function pagesForRole(role: Role): AppPage[] {
  return APP_PAGES.filter((p) => roleAllowsPage(role, p.key));
}

export type PageAccessInput = {
  role: Role;
  isSuperadmin: boolean;
  /** null = rolunun izin verdigi tum sayfalar. */
  pageAccess: PageKey[] | null;
};

/**
 * Kisi bazli liste yalnizca KISITLAR, yetki VERMEZ: once rol kontrol edilir.
 * Super yonetici hicbir zaman kisitlanmaz (kilitlenip kalmayi onler).
 */
export function canSeePage(access: PageAccessInput, key: PageKey): boolean {
  if (access.isSuperadmin) return true;
  if (!roleAllowsPage(access.role, key)) return false;
  if (access.pageAccess === null) return true;
  return access.pageAccess.includes(key);
}

export function visiblePages(access: PageAccessInput): AppPage[] {
  return APP_PAGES.filter((page) => canSeePage(access, page.key));
}

/** Erisilen ilk sayfa: yetkisiz istekler buraya yonlendirilir. */
export function firstVisibleHref(access: PageAccessInput): string | null {
  return visiblePages(access)[0]?.href ?? null;
}

/**
 * Kaydedilecek listeyi temizler: gecersiz anahtarlari ve rolun zaten
 * goremedigi sayfalari atar. Liste rolun tumunu kapsiyorsa null'a doner,
 * boylece rol sonradan yukseltilirse erisim kendiliginden genisler.
 */
export function normalizePageAccess(
  input: unknown,
  role: Role,
): PageKey[] | null {
  if (!Array.isArray(input)) return null;
  const allowed = pagesForRole(role).map((p) => p.key);
  const selected = allowed.filter(
    (key) => input.includes(key) && isPageKey(key),
  );
  if (selected.length === 0) return [];
  return selected.length === allowed.length ? null : selected;
}

/** Veritabanindan gelen text[] degerini guvenli sekilde tiplendirir. */
export function parsePageAccess(value: unknown): PageKey[] | null {
  if (!Array.isArray(value)) return null;
  return value.filter(isPageKey);
}
