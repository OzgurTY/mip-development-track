"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import type { FieldDefinition } from "@/lib/fields/types";

function asString(value: unknown): string {
  if (value === null || value === undefined) return "";
  return String(value);
}

function asBool(value: unknown): boolean {
  return value === true || value === "true";
}

function asArray(value: unknown): string[] {
  if (Array.isArray(value)) return value.map(String);
  return [];
}

export function DynamicField({
  def,
  value,
}: {
  def: FieldDefinition;
  value?: unknown;
}) {
  const name = `cf_${def.key}`;

  // Boolean = a clean checkbox row (var/yok). Unchecked sends nothing = "yok".
  if (def.type === "boolean") {
    return (
      <label className="press flex cursor-pointer items-center gap-2.5 rounded-xl bg-muted/50 px-3 py-2.5 text-sm ring-1 ring-foreground/[0.04] transition-colors hover:bg-muted">
        <input
          type="checkbox"
          name={name}
          value="true"
          defaultChecked={asBool(value)}
          className="size-4 rounded"
          style={{ accentColor: "var(--primary)" }}
        />
        <span className="font-medium">{def.label}</span>
      </label>
    );
  }

  return (
    <div className="space-y-1.5">
      <Label htmlFor={name}>
        {def.label}
        {def.required ? <span className="ml-1 text-destructive">*</span> : null}
      </Label>
      <FieldControl def={def} name={name} value={value} />
    </div>
  );
}

function FieldControl({
  def,
  name,
  value,
}: {
  def: FieldDefinition;
  name: string;
  value?: unknown;
}) {
  const [selected, setSelected] = useState<string[]>(asArray(value));

  switch (def.type) {
    case "textarea":
      return (
        <Textarea
          id={name}
          name={name}
          required={def.required}
          defaultValue={asString(value)}
        />
      );
    case "number":
      return (
        <Input
          id={name}
          name={name}
          type="number"
          required={def.required}
          defaultValue={asString(value)}
        />
      );
    case "date":
      return (
        <Input
          id={name}
          name={name}
          type="date"
          required={def.required}
          defaultValue={asString(value)}
        />
      );
    case "select":
      return (
        <Select
          id={name}
          name={name}
          required={def.required}
          defaultValue={asString(value)}
        >
          <option value="">Seçiniz</option>
          {def.options.map((opt) => (
            <option key={opt} value={opt}>
              {opt}
            </option>
          ))}
        </Select>
      );
    case "multiselect":
      return (
        <div className="grid grid-cols-2 gap-1.5">
          {def.options.map((opt) => {
            const checked = selected.includes(opt);
            return (
              <label
                key={opt}
                className="flex items-center gap-2 rounded-lg bg-muted/40 px-2.5 py-1.5 text-sm"
              >
                <input
                  type="checkbox"
                  checked={checked}
                  style={{ accentColor: "var(--primary)" }}
                  onChange={(e) =>
                    setSelected((prev) =>
                      e.target.checked
                        ? [...prev, opt]
                        : prev.filter((v) => v !== opt),
                    )
                  }
                />
                {opt}
              </label>
            );
          })}
          <input type="hidden" name={name} value={JSON.stringify(selected)} />
        </div>
      );
    case "text":
    default:
      return (
        <Input
          id={name}
          name={name}
          type={def.is_sensitive ? "password" : "text"}
          autoComplete={def.is_sensitive ? "new-password" : undefined}
          required={def.required}
          defaultValue={def.is_sensitive ? undefined : asString(value)}
        />
      );
  }
}
