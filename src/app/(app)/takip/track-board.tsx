"use client";

import Link from "next/link";
import { TrackEdit } from "./track-edit";
import { StatusBadge } from "@/components/status-badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { BoardRow } from "@/lib/track/types";
import type { FieldDefinition } from "@/lib/fields/types";

type Props = {
  rows: BoardRow[];
  defs: FieldDefinition[];
  canEdit: boolean;
};

export function TrackBoard({ rows, defs, canEdit }: Props) {
  return (
    <div className="bento overflow-hidden">
      <Table>
        <TableHeader className="bg-muted/40">
          <TableRow className="hover:bg-transparent [&_th]:h-11 [&_th]:px-4 [&_th]:text-xs [&_th]:font-semibold [&_th]:tracking-wide [&_th]:text-muted-foreground [&_th]:uppercase">
            <TableHead>Müşteri</TableHead>
            <TableHead>Durum</TableHead>
            <TableHead>Proje</TableHead>
            <TableHead>Lead</TableHead>
            <TableHead>Son güncelleme</TableHead>
            {canEdit && <TableHead />}
          </TableRow>
        </TableHeader>
        <TableBody className="[&_td]:px-4 [&_td]:py-3 [&_tr]:hover:bg-accent/60">
          {rows.map((row) => (
            <TableRow key={row.customerId}>
              <TableCell>
                <Link
                  href={`/musteriler/${row.customerId}`}
                  className="font-medium text-primary underline-offset-4 hover:underline"
                >
                  {row.name}
                </Link>
              </TableCell>
              <TableCell>
                <StatusBadge status={row.record?.status ?? null} />
              </TableCell>
              <TableCell>{row.record?.project ?? ""}</TableCell>
              <TableCell>{row.record?.lead ?? ""}</TableCell>
              <TableCell className="max-w-[28rem] truncate text-muted-foreground">
                {row.lastUpdate ? row.lastUpdate.body : ""}
              </TableCell>
              {canEdit && (
                <TableCell className="text-right">
                  <TrackEdit
                    customerId={row.customerId}
                    name={row.name}
                    record={row.record}
                    defs={defs}
                  />
                </TableCell>
              )}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
