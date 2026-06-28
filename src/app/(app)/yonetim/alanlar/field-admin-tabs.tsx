"use client";

import { useState } from "react";
import { FieldList } from "./field-list";
import { FieldForm } from "./field-form";
import { InfraFieldAdmin } from "./infra-field-admin";
import type { FieldDefinition } from "@/lib/fields/types";
import type { InfraType } from "@/lib/infra/types";

export type FlatGroup = {
  entity: string;
  label: string;
  description: string;
  defs: FieldDefinition[];
};

export type InfraGroup = {
  label: string;
  description: string;
  types: InfraType[];
  fieldsByType: Record<string, FieldDefinition[]>;
};

export function FieldAdminTabs({
  flat,
  infra,
}: {
  flat: FlatGroup[];
  infra: InfraGroup;
}) {
  const infraCount = Object.values(infra.fieldsByType).reduce(
    (a, b) => a + b.length,
    0,
  );
  const tabs = [
    ...flat.map((g) => ({ key: g.entity, label: g.label, count: g.defs.length })),
    { key: "infra", label: infra.label, count: infraCount },
  ];
  const [active, setActive] = useState(tabs[0]?.key ?? "customer");
  const flatCurrent = flat.find((g) => g.entity === active);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="inline-flex flex-wrap gap-1 rounded-2xl bg-muted/60 p-1">
          {tabs.map((t) => (
            <button
              key={t.key}
              type="button"
              onClick={() => setActive(t.key)}
              className={
                active === t.key
                  ? "press inline-flex items-center gap-1.5 rounded-xl bg-card px-3.5 py-1.5 text-sm font-semibold shadow-[var(--shadow-soft)]"
                  : "press inline-flex items-center gap-1.5 rounded-xl px-3.5 py-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
              }
            >
              {t.label}
              <span className="text-xs tabular-nums opacity-60">{t.count}</span>
            </button>
          ))}
        </div>
        {flatCurrent ? <FieldForm entity={flatCurrent.entity} /> : null}
      </div>

      {flatCurrent ? (
        <>
          <p className="text-sm text-muted-foreground">
            {flatCurrent.description}
          </p>
          <FieldList defs={flatCurrent.defs} />
        </>
      ) : (
        <InfraFieldAdmin types={infra.types} fieldsByType={infra.fieldsByType} />
      )}
    </div>
  );
}
