"use client";

import { useMemo, useState } from "react";
import { Layers, ArrowDown } from "lucide-react";
import { VersionEdit } from "./version-edit";
import { Button } from "@/components/ui/button";
import { SearchInput } from "@/components/search-input";
import { EmptyState } from "@/components/empty-state";
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

type Props = {
  rows: MatrixRow[];
  components: ComponentLatest[];
  defs: FieldDefinition[];
  canEdit: boolean;
};

export function VersionMatrix({ rows, components, defs, canEdit }: Props) {
  const [query, setQuery] = useState("");
  const colSpan = 3 + components.length + (canEdit ? 1 : 0);

  const behindByRow = useMemo(() => {
    const m = new Map<string, number>();
    for (const r of rows) {
      let b = 0;
      for (const c of components) {
        if (
          compareVersion(
            String(r.custom_fields?.[c.key] ?? ""),
            c.latest_version,
            c.kind,
          ) === "behind"
        )
          b++;
      }
      m.set(r.id, b);
    }
    return m;
  }, [rows, components]);

  const behindInstalls = useMemo(
    () => [...behindByRow.values()].filter((b) => b > 0).length,
    [behindByRow],
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLocaleLowerCase("tr");
    if (!q) return rows;
    return rows.filter((r) =>
      r.customerName.toLocaleLowerCase("tr").includes(q),
    );
  }, [rows, query]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-x-5 gap-y-3">
        <SearchInput
          value={query}
          onChange={setQuery}
          placeholder="Müşteri ara..."
          className="w-full max-w-xs"
        />
        <Stat value={rows.length} label="kurulum" />
        <Stat
          value={rows.length - behindInstalls}
          label="güncel"
          tone="var(--accent-emerald)"
        />
        <Stat value={behindInstalls} label="geride" tone="var(--accent-rose)" />
        <div className="ml-auto flex flex-wrap gap-x-4 gap-y-1.5">
          <Legend color="var(--accent-rose)">Geride</Legend>
          <Legend color="color-mix(in oklch, var(--foreground) 35%, transparent)">
            Güncel
          </Legend>
          <Legend color="color-mix(in oklch, var(--foreground) 14%, transparent)">
            Kurulu değil
          </Legend>
        </div>
      </div>

      <div className="bento overflow-hidden p-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-b hover:bg-transparent">
                <Th sticky>Müşteri</Th>
                <Th>Sistem</Th>
                <Th>Konum</Th>
                {components.map((c) => (
                  <th
                    key={c.key}
                    className="h-auto px-3 py-2.5 text-left align-bottom whitespace-nowrap"
                  >
                    <span className="block text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                      {c.label}
                    </span>
                    {c.latest_version ? (
                      <span className="mt-0.5 block font-mono text-[0.65rem] font-normal text-muted-foreground/60">
                        güncel {c.latest_version}
                      </span>
                    ) : null}
                  </th>
                ))}
                {canEdit ? <Th /> : null}
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow className="hover:bg-transparent">
                  <TableCell colSpan={colSpan} className="p-0">
                    <EmptyState
                      icon={Layers}
                      title={
                        query ? "Eşleşen kurulum yok" : "Henüz sürüm kaydı yok"
                      }
                      description={query ? "Aramayı değiştir." : undefined}
                    />
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((row) => (
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
                    {components.map((c) => {
                      const installed = String(row.custom_fields?.[c.key] ?? "");
                      const status = compareVersion(
                        installed,
                        c.latest_version,
                        c.kind,
                      );
                      return (
                        <TableCell key={c.key} className="px-3 py-2.5">
                          <Cell value={installed} status={status} />
                        </TableCell>
                      );
                    })}
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
                ))
              )}
            </TableBody>
          </Table>
        </div>
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

function Stat({
  value,
  label,
  tone,
}: {
  value: number;
  label: string;
  tone?: string;
}) {
  return (
    <span className="flex items-baseline gap-1.5">
      <span
        className="font-display text-lg font-bold tabular-nums"
        style={{ color: tone }}
      >
        {value}
      </span>
      <span className="text-sm text-muted-foreground">{label}</span>
    </span>
  );
}

function Legend({
  color,
  children,
}: {
  color: string;
  children: React.ReactNode;
}) {
  return (
    <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
      <span className="size-2.5 rounded-full" style={{ background: color }} />
      {children}
    </span>
  );
}
