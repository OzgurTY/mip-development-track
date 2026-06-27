"use client";

import { VersionEdit } from "./version-edit";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { compareVersion, type DriftStatus } from "@/lib/versions/drift";
import type { ComponentLatest, MatrixRow } from "@/lib/versions/types";
import type { FieldDefinition } from "@/lib/fields/types";

const TONE: Record<DriftStatus, string> = {
  current: "bg-chart-3/15",
  behind: "bg-destructive/15 text-destructive",
  ahead: "bg-chart-1/15",
  unknown: "text-muted-foreground",
};

type Props = {
  rows: MatrixRow[];
  components: ComponentLatest[];
  defs: FieldDefinition[];
  canEdit: boolean;
};

export function VersionMatrix({ rows, components, defs, canEdit }: Props) {
  const colSpan = 3 + components.length + (canEdit ? 1 : 0);
  return (
    <div className="overflow-x-auto rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Müşteri</TableHead>
            <TableHead>Sistem</TableHead>
            <TableHead>Konum</TableHead>
            {components.map((c) => (
              <TableHead key={c.key}>{c.label}</TableHead>
            ))}
            {canEdit && <TableHead />}
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={colSpan}
                className="py-10 text-center text-muted-foreground"
              >
                Henüz sürüm kaydı yok.
              </TableCell>
            </TableRow>
          ) : (
            rows.map((row) => (
              <TableRow key={row.id}>
                <TableCell className="font-medium">{row.customerName}</TableCell>
                <TableCell>{row.system ?? ""}</TableCell>
                <TableCell className="text-muted-foreground">
                  {row.deployment ?? ""}
                </TableCell>
                {components.map((c) => {
                  const installed = String(row.custom_fields?.[c.key] ?? "");
                  const status = compareVersion(
                    installed,
                    c.latest_version,
                    c.kind,
                  );
                  return (
                    <TableCell key={c.key} className={TONE[status]}>
                      {installed || "-"}
                    </TableCell>
                  );
                })}
                {canEdit && (
                  <TableCell className="text-right">
                    <VersionEdit
                      customerId={row.customer_id}
                      customerName={row.customerName}
                      record={row}
                      defs={defs}
                      trigger={
                        <Button variant="ghost" size="sm">
                          Düzenle
                        </Button>
                      }
                    />
                  </TableCell>
                )}
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
