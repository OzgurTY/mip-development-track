export type ComponentLatest = {
  key: string;
  label: string;
  kind: "semver" | "date";
  latest_version: string | null;
  source_note: string | null;
};

export type VersionRecord = {
  id: string;
  customer_id: string;
  system: string | null;
  deployment: string | null;
  os: string | null;
  status: string | null;
  middleware: string | null;
  package: string | null;
  custom_fields: Record<string, unknown>;
};

export type MatrixRow = VersionRecord & { customerName: string };
