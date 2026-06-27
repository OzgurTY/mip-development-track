"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import type { FieldDefinition } from "@/lib/fields/types";

export function DynamicField({ def }: { def: FieldDefinition }) {
  const name = `cf_${def.key}`;
  return (
    <div className="space-y-1.5">
      <Label htmlFor={name}>
        {def.label}
        {def.required && <span className="ml-1 text-destructive">*</span>}
      </Label>
      <FieldControl def={def} name={name} />
    </div>
  );
}

function FieldControl({ def, name }: { def: FieldDefinition; name: string }) {
  const [bool, setBool] = useState(false);
  const [selected, setSelected] = useState<string[]>([]);

  switch (def.type) {
    case "textarea":
      return <Textarea id={name} name={name} required={def.required} />;
    case "number":
      return <Input id={name} name={name} type="number" required={def.required} />;
    case "date":
      return <Input id={name} name={name} type="date" required={def.required} />;
    case "boolean":
      return (
        <div className="flex items-center gap-2">
          <Switch id={name} checked={bool} onCheckedChange={setBool} />
          <input type="hidden" name={name} value={bool ? "true" : "false"} />
        </div>
      );
    case "select":
      return (
        <select
          id={name}
          name={name}
          required={def.required}
          defaultValue=""
          className="h-9 w-full rounded-md border bg-transparent px-3 text-sm"
        >
          <option value="" disabled>
            Seçiniz
          </option>
          {def.options.map((opt) => (
            <option key={opt} value={opt}>
              {opt}
            </option>
          ))}
        </select>
      );
    case "multiselect":
      return (
        <div className="space-y-1">
          {def.options.map((opt) => {
            const checked = selected.includes(opt);
            return (
              <label key={opt} className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={checked}
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
      return <Input id={name} name={name} required={def.required} />;
  }
}
