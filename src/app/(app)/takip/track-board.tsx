"use client";

import { TrackEdit } from "./track-edit";
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

const STATUS_TONE: Record<string, string> = {
  Aktif: "bg-chart-3/15 text-foreground",
  Stabil: "bg-chart-1/15 text-foreground",
  Beklemede: "bg-chart-4/20 text-foreground",
  İnaktif: "bg-muted text-muted-foreground",
};

type Props = {
  rows: BoardRow[];
  defs: FieldDefinition[];
  canEdit: boolean;
};

export function TrackBoard({ rows, defs, canEdit }: Props) {
  return (
    <div className="rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Müşteri</TableHead>
            <TableHead>Durum</TableHead>
            <TableHead>Proje</TableHead>
            <TableHead>Lead</TableHead>
            <TableHead>Son güncelleme</TableHead>
            {canEdit && <TableHead />}
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row) => (
            <TableRow key={row.customerId}>
              <TableCell className="font-medium">{row.name}</TableCell>
              <TableCell>
                {row.record?.status ? (
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs ${
                      STATUS_TONE[row.record.status] ?? "bg-muted"
                    }`}
                  >
                    {row.record.status}
                  </span>
                ) : (
                  <span className="text-muted-foreground">-</span>
                )}
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
