export const INFRA_TYPES = [
  ["sunucu", "Sunucu"],
  ["mip", "MIP"],
  ["baglanti", "Bağlantı"],
  ["vpn", "VPN"],
  ["diger", "Diğer"],
] as const;

export type InfraField = {
  key: string;
  label: string;
  value: string;
  sensitive: boolean;
};

export type Attachment = {
  id: string;
  name: string;
  url: string | null;
};

export type Credential = {
  id: string;
  username: string;
  secret: string | null; // decrypted server-side; masked in the UI
  role: string | null;
  note: string | null;
};

export type InfraType = {
  id: string;
  key: string;
  label: string;
  sort_order: number;
};

export type InfraEntry = {
  id: string;
  customer_id: string;
  type: string;
  typeLabel: string;
  label: string;
  notes: string | null;
  fields: InfraField[];
  attachments: Attachment[];
  credentials: Credential[];
};
