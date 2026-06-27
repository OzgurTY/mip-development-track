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
  current: "bg-[color-mix(in_oklch,var(--accent-emerald)_14%,transparent)]",
  behind:
    "bg-[color-mix(in_oklch,var(--accent-rose)_18%,transparent)] font-semibold",
  ahead: "bg-[color-mix(in_oklch,var(--accent-sky)_14%,transparent)]",
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
    <div className="bento overflow-hidden">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader className="bg-muted/40">
            <TableRow className="hover:bg-transparent [&_th]:h-11 [&_th]:px-3 [&_th]:text-xs [&_th]:font-semibold [&_th]:tracking-wide [&_th]:text-muted-foreground [&_th]:uppercase">
              <TableHead className="sticky left-0 bg-muted/40">Müşteri</TableHead>
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
                  className="py-14 text-center text-muted-foreground"
                >
                  Henüz sürüm kaydı yok.
                </TableCell>
              </TableRow>
            ) : (
              rows.map((row) => (
                <TableRow key={row.id} className="hover:bg-accent/40">
                  <TableCell className="sticky left-0 bg-card px-3 font-medium">
                    {row.customerName}
                  </TableCell>
                  <TableCell className="px-3">{row.system ?? ""}</TableCell>
                  <TableCell className="px-3 text-muted-foreground">
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
                      <TableCell
                        key={c.key}
                        className={`px-3 font-mono text-xs ${TONE[status]}`}
                      >
                        {installed || "-"}
                      </TableCell>
                    );
                  })}
                  {canEdit && (
                    <TableCell className="px-3 text-right">
                      <VersionEdit
                        customerId={row.customer_id}
                        customerName={row.customerName}
                        record={row}
                        defs={defs}
                        trigger={
                          <Button variant="ghost" size="sm" className="press">
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
    </div>
  );
}
