export const TRACK_STATUSES = [
  "Aktif",
  "Stabil",
  "Beklemede",
  "İnaktif",
] as const;
export type TrackStatus = (typeof TRACK_STATUSES)[number];

export type TrackRecord = {
  customer_id: string;
  status: string | null;
  project: string | null;
  scope: string | null;
  lead: string | null;
  responsibles: string | null;
  custom_fields: Record<string, unknown>;
};

export type TrackUpdate = {
  id: string;
  customer_id: string;
  week_date: string;
  body: string;
  created_at: string;
};

export type BoardRow = {
  customerId: string;
  name: string;
  record: TrackRecord | null;
  lastUpdate: TrackUpdate | null;
};
