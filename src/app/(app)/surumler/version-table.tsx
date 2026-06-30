"use client";

import { ArrowDown, Check } from "lucide-react";
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
import { isFeatureOn, type VersionCatalog } from "@/lib/versions/catalog";
import type { MatrixRow } from "@/lib/versions/types";
import type { FieldDefinition } from "@/lib/fields/types";

type Props = {
  rows: MatrixRow[];
  catalog: VersionCatalog;
  defs: FieldDefinition[];
  canEdit: boolean;
};

export function VersionTable({ rows, catalog, defs, canEdit }: Props) {
  return (
    <div className="bento overflow-hidden p-0">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="border-b hover:bg-transparent">
              <Th sticky>Müşteri</Th>
              <Th>Sistem</Th>
              <Th>Konum</Th>
              {catalog.components.map((c) => (
                <th
                  key={c.key}
                  className="h-auto px-3 py-2.5 text-left align-bottom whitespace-nowrap"
                >
                  <span className="block text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                    {c.label}
                  </span>
                  {c.latest ? (
                    <span className="mt-0.5 block font-mono text-[0.65rem] font-normal text-muted-foreground/60">
                      güncel {c.latest}
                    </span>
                  ) : null}
                </th>
              ))}
              {catalog.features.map((f) => (
                <th
                  key={f.key}
                  className="h-11 px-3 text-center align-bottom text-xs font-semibold tracking-wide text-muted-foreground uppercase whitespace-nowrap"
                >
                  {f.label}
                </th>
              ))}
              {canEdit ? <Th /> : null}
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row) => (
              <TableRow
                key={row.id}
                className="group border-0 border-b border-border/50 hover:bg-accent/40"
              >
                <TableCell className="sticky left-0 z-10 bg-card px-4 py-2.5 font-medium group-hover:bg-[color-mix(in_oklch,var(--accent)_40%,var(--card))]">
                  {row.customerName}
                </TableCell>
                <TableCell className="px-3 py-2.5">
                  {row.system ? (
                    <span className="rounded-md bg-muted px-2 py-0.5 text-xs font-medium">
                      {row.system}
                    </span>
                  ) : null}
                </TableCell>
                <TableCell className="px-3 py-2.5 text-sm text-muted-foreground">
                  {row.deployment ?? ""}
                </TableCell>
                {catalog.components.map((c) => {
                  const installed = String(row.custom_fields?.[c.key] ?? "");
                  const status = compareVersion(installed, c.latest, c.kind);
                  return (
                    <TableCell key={c.key} className="px-3 py-2.5">
                      <Cell value={installed} status={status} />
                    </TableCell>
                  );
                })}
                {catalog.features.map((f) => (
                  <TableCell key={f.key} className="px-3 py-2.5 text-center">
                    {isFeatureOn(row.custom_fields?.[f.key]) ? (
                      <Check className="mx-auto size-4 text-accent-emerald" />
                    ) : (
                      <span className="text-muted-foreground/40">-</span>
                    )}
                  </TableCell>
                ))}
                {canEdit ? (
                  <TableCell className="px-3 py-2.5 text-right">
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
                ) : null}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

// Exception-highlighted cell: only "behind" gets a colored badge; current is
// quiet mono; not-installed is a muted dash. Less noise than a full heatmap.
function Cell({ value, status }: { value: string; status: DriftStatus }) {
  if (status === "behind") {
    return (
      <span className="inline-flex items-center gap-1 rounded-md bg-[color-mix(in_oklch,var(--accent-rose)_16%,transparent)] px-1.5 py-0.5 font-mono text-xs font-semibold text-accent-rose">
        <ArrowDown className="size-3" />
        {value}
      </span>
    );
  }
  if (status === "unknown" || !value) {
    return <span className="font-mono text-xs text-muted-foreground/50">-</span>;
  }
  return <span className="font-mono text-xs text-foreground">{value}</span>;
}

function Th({
  children,
  sticky,
}: {
  children?: React.ReactNode;
  sticky?: boolean;
}) {
  return (
    <TableHead
      className={
        sticky
          ? "sticky left-0 z-10 h-11 bg-card px-4 align-bottom text-xs font-semibold tracking-wide text-muted-foreground uppercase"
          : "h-11 px-3 align-bottom text-xs font-semibold tracking-wide text-muted-foreground uppercase"
      }
    >
      {children}
    </TableHead>
  );
}
