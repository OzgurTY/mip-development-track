import type { PocCriterion, PocProcess, PocWork } from "./types";

/**
 * Yeni PoC olusturulurken sablon icerik. Standart is akisi zaten sabit:
 * kurulum > erisimler > surec gelistirme > mesaj testi. Kullanici sadece
 * tarih ve sonuclari doldurur, gereksiz satiri siler.
 */
export const DEFAULT_WORKS: PocWork[] = [
  { name: "MIP kurulumu ve yapılandırması", status: "Bekliyor", date: "" },
  {
    name: "Kaynak ve hedef sistem erişimlerinin alınması",
    status: "Bekliyor",
    date: "",
  },
  {
    name: "Süreçlerin MIP üzerinde geliştirilmesi",
    status: "Bekliyor",
    date: "",
  },
  { name: "Uçtan uca test ve mesaj doğrulama", status: "Bekliyor", date: "" },
];

/** PoC genelinde gecerli, surecten bagimsiz kriterler. */
export const DEFAULT_GENERAL_CRITERIA: PocCriterion[] = [
  { text: "MIP müşteri ortamına kurulmuş ve çalışır durumda", status: "", note: "" },
  { text: "Kaynak ve hedef sistemlere bağlantı sağlanmış", status: "", note: "" },
  { text: "Süreçler MIP üzerinden izlenebiliyor", status: "", note: "" },
  { text: "Hata durumunda mesaj kaybı yaşanmıyor", status: "", note: "" },
];

/** Her yeni surecin icine kopyalanan kriterler. */
export const DEFAULT_PROCESS_CRITERIA: PocCriterion[] = [
  { text: "Süreç uçtan uca çalışıyor", status: "", note: "" },
  { text: "Mesajlar hedef sisteme hatasız ulaşıyor", status: "", note: "" },
  { text: "Aktarılan veri kaynak ile birebir eşleşiyor", status: "", note: "" },
  { text: "Hatalı kayıt akışı durdurmuyor", status: "", note: "" },
];

/** Yeni surec, varsayilan kriterleriyle birlikte gelir. */
export function newProcess(): PocProcess {
  return {
    name: "",
    source: "",
    target: "",
    method: "",
    sent: "",
    ok: "",
    failed: "",
    result: "",
    criteria: DEFAULT_PROCESS_CRITERIA.map((c) => ({ ...c })),
  };
}

export const EMPTY_WORK: PocWork = { name: "", status: "Bekliyor", date: "" };
export const EMPTY_CRITERION: PocCriterion = { text: "", status: "", note: "" };

export const DEPLOYMENT_OPTIONS = [
  "Müşteri sunucusu (on-premise)",
  "Müşteri bulut aboneliği",
  "MDP bulut ortamı",
  "Hibrit",
] as const;

export const METHOD_OPTIONS = [
  "REST",
  "SOAP",
  "Dosya (SFTP)",
  "Veritabanı",
  "IDoc",
  "RFC",
  "Diğer",
] as const;
