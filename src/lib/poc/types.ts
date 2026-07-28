export const POC_STATUSES = [
  "Planlandı",
  "Devam ediyor",
  "Tamamlandı",
  "İptal",
] as const;
export type PocStatus = (typeof POC_STATUSES)[number];

export const POC_RESULTS = [
  "Başarılı",
  "Kısmen Başarılı",
  "Başarısız",
] as const;
export type PocResult = (typeof POC_RESULTS)[number];

export const WORK_STATUSES = [
  "Tamamlandı",
  "Devam ediyor",
  "Bekliyor",
] as const;
export const TEST_RESULTS = ["Başarılı", "Kısmen", "Başarısız"] as const;
export const CRITERION_STATUSES = [
  "Karşılandı",
  "Kısmen",
  "Karşılanmadı",
] as const;

export type PocCriterion = {
  text: string;
  status: string;
  note: string;
};

/**
 * Bir PoC sureci: tanimi, mesaj sonuclari ve yalnizca kendisi icin gecerli
 * kabul kriterleri. PoC genelinde gecerli kriterler ayri tutulur.
 */
export type PocProcess = {
  name: string;
  source: string;
  target: string;
  method: string;
  sent: string;
  ok: string;
  failed: string;
  result: string;
  criteria: PocCriterion[];
};

export type PocWork = {
  name: string;
  status: string;
  date: string;
};

/** Bir PoC dokumaninin tamami. Tekrar eden bloklar jsonb dizisi olarak saklanir. */
export type PocRecord = {
  id: string;
  /** Kayitli musteriyle opsiyonel baglanti; aday firmalarda null. */
  customer_id: string | null;
  /** Belgede gorunen firma adi. Kaynak burasidir. */
  customer_name: string;
  title: string;
  status: string;
  result: string | null;

  start_date: string | null;
  end_date: string | null;
  deployment: string | null;
  team_mdp: string | null;
  team_customer: string | null;

  purpose: string | null;
  out_of_scope: string | null;

  server_info: string | null;
  os_info: string | null;
  mip_version: string | null;
  install_date: string | null;
  access_note: string | null;
  install_result: string | null;

  processes: PocProcess[];
  works: PocWork[];
  /** Genel kabul kriterleri (surecten bagimsiz). */
  criteria: PocCriterion[];

  updated_at: string;
};

export type PocListRow = Pick<
  PocRecord,
  "id" | "title" | "status" | "result" | "start_date" | "end_date" | "updated_at"
> & {
  customerId: string | null;
  customerName: string;
  processCount: number;
  criteriaMet: number;
  criteriaTotal: number;
};

/** Onizleme ve docx ciktisinda ayni basliklar kullanilir. */
export const POC_SECTIONS = {
  scope: "1. Amaç ve Kapsam",
  install: "2. Kurulum ve Erişimler",
  works: "3. Yapılan İşler",
  processes: "4. Süreçler ve Sonuçları",
  criteria: "5. Genel Kabul Kriterleri",
} as const;
