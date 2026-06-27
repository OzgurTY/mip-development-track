"use client";

import { DynamicField } from "./dynamic-field";
import type { FieldDefinition } from "@/lib/fields/types";

export function DynamicFields({ defs }: { defs: FieldDefinition[] }) {
  if (defs.length === 0) return null;
  return (
    <>
      {defs.map((def) => (
        <DynamicField key={def.id} def={def} />
      ))}
    </>
  );
}
