"use client";

import { useMemo, useState } from "react";
import {
  getCoreRowModel,
  useReactTable,
  flexRender,
} from "@tanstack/react-table";
import { Users } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { SearchInput } from "@/components/search-input";
import { EmptyState } from "@/components/empty-state";
import { buildColumns, type CustomerRow } from "./columns";
import type { FieldDefinition } from "@/lib/fields/types";

type Props = {
  rows: CustomerRow[];
  canDelete: boolean;
  defs: FieldDefinition[];
};

export function CustomerTable({ rows, canDelete, defs }: Props) {
  const [query, setQuery] = useState("");
  const columns = useMemo(
    () => buildColumns(canDelete, defs),
    [canDelete, defs],
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLocaleLowerCase("tr");
    if (!q) return rows;
    return rows.filter((r) => r.name.toLocaleLowerCase("tr").includes(q));
  }, [rows, query]);

  const table = useReactTable({
    data: filtered,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <SearchInput
          value={query}
          onChange={setQuery}
          placeholder="Müşteri ara..."
          className="w-full max-w-xs"
        />
        <span className="text-sm text-muted-foreground tabular-nums">
          {filtered.length} / {rows.length}
        </span>
      </div>

      <div className="bento overflow-hidden">
        <Table>
          <TableHeader className="bg-muted/40">
            {table.getHeaderGroups().map((group) => (
              <TableRow key={group.id} className="hover:bg-transparent">
                {group.headers.map((header, idx) => (
                  <TableHead
                    key={header.id}
                    className={
                      idx === 0 && canDelete
                        ? "h-11 pr-4 pl-12 text-xs font-semibold tracking-wide text-muted-foreground uppercase"
                        : "h-11 px-4 text-xs font-semibold tracking-wide text-muted-foreground uppercase"
                    }
                  >
                    {flexRender(
                      header.column.columnDef.header,
                      header.getContext(),
                    )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows.length === 0 ? (
              <TableRow className="hover:bg-transparent">
                <TableCell colSpan={columns.length} className="p-0">
                  <EmptyState
                    icon={Users}
                    title={query ? "Eşleşen müşteri yok" : "Henüz müşteri yok"}
                    description={
                      query
                        ? "Aramayı değiştirip tekrar dene."
                        : "İlk müşteriyi eklemek için sağ üstteki butonu kullan."
                    }
                  />
                </TableCell>
              </TableRow>
            ) : (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id} className="group hover:bg-accent/60">
                  {row.getVisibleCells().map((cell, idx) => (
                    <TableCell
                      key={cell.id}
                      className={
                        idx === 0 && canDelete
                          ? "relative py-2.5 pr-4 pl-12"
                          : "px-4 py-2.5"
                      }
                    >
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
