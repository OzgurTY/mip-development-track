"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { DeleteCustomerButton } from "./delete-button";
import type { FieldDefinition } from "@/lib/fields/types";

export type CustomerRow = {
  id: string;
  name: string;
  is_active: boolean;
  custom_fields: Record<string, unknown>;
};

function renderValue(value: unknown): string {
  if (value === null || value === undefined) return "";
  if (Array.isArray(value)) return value.join(", ");
  if (typeof value === "boolean") return value ? "Evet" : "Hayır";
  return String(value);
}

export function buildColumns(
  canDelete: boolean,
  defs: FieldDefinition[],
): ColumnDef<CustomerRow>[] {
  const cols: ColumnDef<CustomerRow>[] = [
    { accessorKey: "name", header: "Müşteri" },
    {
      accessorKey: "is_active",
      header: "Durum",
      cell: ({ row }) =>
        row.original.is_active ? (
          "Aktif"
        ) : (
          <span className="text-muted-foreground">Pasif</span>
        ),
    },
  ];

  for (const def of defs) {
    cols.push({
      id: `cf_${def.key}`,
      header: def.label,
      cell: ({ row }) => renderValue(row.original.custom_fields?.[def.key]),
    });
  }

  if (canDelete) {
    cols.push({
      id: "actions",
      header: "",
      cell: ({ row }) => (
        <div className="text-right">
          <DeleteCustomerButton id={row.original.id} name={row.original.name} />
        </div>
      ),
    });
  }

  return cols;
}
