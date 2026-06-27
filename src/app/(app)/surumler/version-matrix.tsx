"use client";

import { useMemo, useState } from "react";
import { Layers } from "lucide-react";
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
      <div className="flex flex-wrap items-center gap-3">
        <SearchInput
          value={query}
          onChange={setQuery}
          placeholder="Müşteri ara..."
          className="w-full max-w-xs"
        />
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-sm">
          <Stat label="Kurulum" value={rows.length} />
          <Stat label="Geride" value={behindInstalls} tone="var(--accent-rose)" />
        </div>
        <div className="ml-auto flex flex-wrap gap-x-4 gap-y-1.5">
          <Legend color="var(--accent-emerald)">Güncel</Legend>
          <Legend color="var(--accent-rose)">Geride</Legend>
          <Legend color="color-mix(in oklch, var(--foreground) 25%, transparent)">
            Kurulu değil
          </Legend>
        </div>
      </div>

      <div className="bento overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-muted/40">
              <TableRow className="hover:bg-transparent [&_th]:h-11 [&_th]:px-3 [&_th]:text-xs [&_th]:font-semibold [&_th]:tracking-wide [&_th]:text-muted-foreground [&_th]:uppercase">
                <TableHead className="sticky left-0 z-10 bg-muted/40">
                  Müşteri
                </TableHead>
                <TableHead>Sistem</TableHead>
                <TableHead>Konum</TableHead>
                {components.map((c) => (
                  <TableHead key={c.key}>{c.label}</TableHead>
                ))}
                {canEdit && <TableHead />}
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow className="hover:bg-transparent">
                  <TableCell colSpan={colSpan} className="p-0">
                    <EmptyState
                      icon={Layers}
                      title={query ? "Eşleşen kurulum yok" : "Henüz sürüm kaydı yok"}
                      description={
                        query ? "Aramayı değiştir." : undefined
                      }
                    />
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((row) => (
                  <TableRow key={row.id} className="group hover:bg-accent/40">
                    <TableCell className="sticky left-0 z-10 bg-card px-3 font-medium group-hover:bg-accent/40">
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
    </div>
  );
}

function Stat({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone?: string;
}) {
  return (
    <span className="flex items-center gap-1.5">
      <span className="font-display font-bold tabular-nums" style={{ color: tone }}>
        {value}
      </span>
      <span className="text-muted-foreground">{label}</span>
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
