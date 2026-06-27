export type Cell = string | number | Date | null | undefined;

export type ImportCustomer = {
  name: string;
  slug: string;
  source: "track" | "version-only";
};

export type ImportTrackRecord = {
  customerName: string;
  status: string | null;
  project: string | null;
  scope: string | null;
  lead: string | null;
  responsibles: string | null;
};

export type ImportTrackUpdate = {
  customerName: string;
  weekDate: string;
  body: string;
};

export type ImportVersionRecord = {
  customerName: string;
  system: string | null;
  deployment: string | null;
  os: string | null;
  status: string | null;
  middleware: string | null;
  package: string | null;
  customFields: Record<string, string>;
};

export type ImportFlag = {
  kind: "unknown-customer" | "unrecognized-value";
  context: string;
  value: string;
};

export type TrackPlan = {
  customers: ImportCustomer[];
  records: ImportTrackRecord[];
  updates: ImportTrackUpdate[];
};

export type VersionPlan = {
  records: ImportVersionRecord[];
  newCustomers: ImportCustomer[];
  flags: ImportFlag[];
};
