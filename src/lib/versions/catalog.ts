import type { ComponentLatest } from "./types";
import type { FieldDefinition } from "@/lib/fields/types";

/**
 * A tracked component (version column / chip). `latest` is the reference version
 * from component_latest when one exists, otherwise null (chip shown without
 * drift coloring until an admin sets a reference).
 */
export type CatalogComponent = {
  key: string;
  label: string;
  kind: "semver" | "date";
  latest: string | null;
};

export type CatalogFeature = {
  key: string;
  label: string;
};

export type VersionCatalog = {
  components: CatalogComponent[];
  features: CatalogFeature[];
  note: FieldDefinition | null;
};

/**
 * Single source of truth for what the version inventory displays: the version
 * field catalog (field_definitions) joined with the latest-version reference
 * (component_latest). Everything an admin adds in Yönetim shows up here, so both
 * the card and table views render it automatically.
 */
export function buildVersionCatalog(
  defs: FieldDefinition[],
  references: ComponentLatest[],
): VersionCatalog {
  const refByKey = new Map(references.map((r) => [r.key, r]));
  const sorted = [...defs].sort((a, b) => a.sort_order - b.sort_order);

  const components: CatalogComponent[] = [];
  const features: CatalogFeature[] = [];
  let note: FieldDefinition | null = null;

  for (const def of sorted) {
    if (def.key === "note") {
      note = def;
      continue;
    }
    if (def.type === "boolean") {
      features.push({ key: def.key, label: def.label });
      continue;
    }
    const ref = refByKey.get(def.key);
    components.push({
      key: def.key,
      label: def.label,
      kind: ref?.kind ?? "semver",
      latest: ref?.latest_version ?? null,
    });
  }

  return { components, features, note };
}

/** Boolean custom fields are stored as `true` (or the string "true" on submit). */
export function isFeatureOn(value: unknown): boolean {
  return value === true || value === "true";
}
