"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { DeleteCustomerButton } from "./delete-button";

export type CustomerRow = {
  id: string;
  name: string;
  is_active: boolean;
};

export function buildColumns(canDelete: boolean): ColumnDef<CustomerRow>[] {
  const base: ColumnDef<CustomerRow>[] = [
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

  if (!canDelete) return base;

  return [
    ...base,
    {
      id: "actions",
      header: "",
      cell: ({ row }) => (
        <div className="text-right">
          <DeleteCustomerButton id={row.original.id} name={row.original.name} />
        </div>
      ),
    },
  ];
}
