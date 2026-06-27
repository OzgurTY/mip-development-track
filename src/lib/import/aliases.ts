// Sürüm sayfasındaki kısa/farklı yazımları kanonik takip adına eşler.
// Kanonik ad = takip sayfasındaki tam yazım (spec §8 kararı).
export const CUSTOMER_ALIASES: Record<string, string> = {
  Deva: "Deva Holding",
  "Dilek Grup": "DilekGrup",
  EAE: "EAE Elektrik",
  "Erciyes Holding": "Erciyes",
  "Ferre-Femaş": "Ferre",
  KaizenGaming: "Kaizen Gaming",
  "Peppol Gateway": "Peppol GW",
  Uludağ: "Uludağ İçecek",
};

export type ResolvedName = { name: string; isNew: boolean };

// canonical: lower(ad) -> kanonik ad (takip sayfasından kurulur).
export function resolveCustomerName(
  raw: string,
  canonical: Map<string, string>,
): ResolvedName {
  const trimmed = raw.trim();
  const direct = canonical.get(trimmed.toLowerCase());
  if (direct) return { name: direct, isNew: false };

  const alias = CUSTOMER_ALIASES[trimmed];
  if (alias) {
    const canon = canonical.get(alias.toLowerCase());
    return { name: canon ?? alias, isNew: false };
  }

  return { name: trimmed, isNew: true };
}
