"use client";

import { useState } from "react";
import { FieldList } from "./field-list";
import { FieldForm } from "./field-form";
import type { FieldDefinition } from "@/lib/fields/types";

export type FieldGroup = {
  entity: string;
  label: string;
  description: string;
  defs: FieldDefinition[];
};

export function FieldAdminTabs({ groups }: { groups: FieldGroup[] }) {
  const [active, setActive] = useState(groups[0]?.entity ?? "customer");
  const current = groups.find((g) => g.entity === active) ?? groups[0];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="inline-flex flex-wrap gap-1 rounded-2xl bg-muted/60 p-1">
          {groups.map((g) => (
            <button
              key={g.entity}
              type="button"
              onClick={() => setActive(g.entity)}
              className={
                active === g.entity
                  ? "press inline-flex items-center gap-1.5 rounded-xl bg-card px-3.5 py-1.5 text-sm font-semibold shadow-[var(--shadow-soft)]"
                  : "press inline-flex items-center gap-1.5 rounded-xl px-3.5 py-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
              }
            >
              {g.label}
              <span className="text-xs tabular-nums opacity-60">
                {g.defs.length}
              </span>
            </button>
          ))}
        </div>
        <FieldForm entity={current.entity} />
      </div>

      <p className="text-sm text-muted-foreground">{current.description}</p>
      <FieldList defs={current.defs} />
    </div>
  );
}
