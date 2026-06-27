"use client";

import Link from "next/link";
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
    {
      accessorKey: "name",
      header: "Müşteri",
      cell: ({ row }) => (
        <Link
          href={`/musteriler/${row.original.id}`}
          className="font-medium underline-offset-4 transition-colors hover:text-primary hover:underline"
        >
          {row.original.name}
        </Link>
      ),
    },
    {
      accessorKey: "is_active",
      header: "Durum",
      cell: ({ row }) =>
        row.original.is_active ? (
          <span className="inline-flex items-center gap-1.5 text-sm">
            <span className="size-1.5 rounded-full bg-accent-emerald" />
            Aktif
          </span>
        ) : (
          <span className="inline-flex items-center gap-1.5 text-sm text-muted-foreground">
            <span className="size-1.5 rounded-full bg-muted-foreground/40" />
            Pasif
          </span>
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
