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

export type InfraEntry = {
  id: string;
  customer_id: string;
  type: string;
  label: string;
  notes: string | null;
  fields: InfraField[];
};
