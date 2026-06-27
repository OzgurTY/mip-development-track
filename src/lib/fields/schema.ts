import { z } from "zod";
import type { FieldDefinition } from "./types";

function fieldSchema(def: FieldDefinition): z.ZodTypeAny {
  switch (def.type) {
    case "number":
      return z.coerce.number();
    case "boolean":
      return z.coerce.boolean();
    case "date":
      return z.string().min(1);
    case "select":
      return def.options.length
        ? z.enum(def.options as [string, ...string[]])
        : z.string();
    case "multiselect":
      return z.array(z.string());
    case "text":
    case "textarea":
    default:
      return z.string();
  }
}

export function buildCustomFieldsSchema(defs: FieldDefinition[]) {
  const shape: Record<string, z.ZodTypeAny> = {};
  for (const def of defs) {
    const base = fieldSchema(def);
    shape[def.key] = def.required ? base : base.optional();
  }
  return z.object(shape);
}
