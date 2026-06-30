"use client";

import Link from "next/link";
import { Pencil } from "lucide-react";
import type { ColumnDef } from "@tanstack/react-table";
import { DeleteCustomerButton } from "./delete-button";
import { CustomerDialog } from "./customer-dialog";
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
  canEdit: boolean,
  canDelete: boolean,
  defs: FieldDefinition[],
): ColumnDef<CustomerRow>[] {
  const cols: ColumnDef<CustomerRow>[] = [
    {
      accessorKey: "name",
      header: "Müşteri",
      cell: ({ row }) => (
        <>
          <Link
            href={`/musteriler/${row.original.id}`}
            className="font-medium underline-offset-4 transition-colors hover:text-primary hover:underline"
          >
            {row.original.name}
          </Link>
          {(canEdit || canDelete) && (
            <span className="row-rail absolute inset-y-0 left-2 flex items-center gap-1">
              {canEdit && (
                <CustomerDialog
                  customer={row.original}
                  defs={defs}
                  trigger={
                    <button
                      type="button"
                      aria-label={`${row.original.name} düzenle`}
                      className="press grid size-8 place-items-center rounded-lg text-muted-foreground transition-colors hover:bg-accent hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
                    >
                      <Pencil className="size-4" />
                    </button>
                  }
                />
              )}
              {canDelete && (
                <DeleteCustomerButton
                  id={row.original.id}
                  name={row.original.name}
                />
              )}
            </span>
          )}
        </>
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

  return cols;
}
