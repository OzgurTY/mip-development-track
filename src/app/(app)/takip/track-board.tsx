"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ListChecks } from "lucide-react";
import { TrackEdit } from "./track-edit";
import { StatusBadge } from "@/components/status-badge";
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
import { TRACK_STATUSES, type BoardRow } from "@/lib/track/types";
import type { FieldDefinition } from "@/lib/fields/types";

type Props = {
  rows: BoardRow[];
  defs: FieldDefinition[];
  canEdit: boolean;
};

export function TrackBoard({ rows, defs, canEdit }: Props) {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<string | null>(null);

  const counts = useMemo(() => {
    const m: Record<string, number> = {};
    for (const r of rows) {
      const s = r.record?.status ?? "";
      if (s) m[s] = (m[s] ?? 0) + 1;
    }
    return m;
  }, [rows]);

  const filtered = useMemo(() => {
    const q = query.trim().toLocaleLowerCase("tr");
    return rows.filter((r) => {
      if (status && r.record?.status !== status) return false;
      if (!q) return true;
      return (
        r.name.toLocaleLowerCase("tr").includes(q) ||
        (r.record?.project ?? "").toLocaleLowerCase("tr").includes(q) ||
        (r.record?.lead ?? "").toLocaleLowerCase("tr").includes(q) ||
        (r.record?.responsibles ?? "").toLocaleLowerCase("tr").includes(q)
      );
    });
  }, [rows, query, status]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <SearchInput
          value={query}
          onChange={setQuery}
          placeholder="Müşteri, proje, lead ara..."
          className="w-full max-w-xs"
        />
        <div className="flex flex-wrap gap-1.5">
          <Chip active={status === null} onClick={() => setStatus(null)}>
            Tümü <Count>{rows.length}</Count>
          </Chip>
          {TRACK_STATUSES.map((s) => (
            <Chip key={s} active={status === s} onClick={() => setStatus(s)}>
              {s} <Count>{counts[s] ?? 0}</Count>
            </Chip>
          ))}
        </div>
      </div>

      <div className="bento overflow-hidden">
        <Table>
          <TableHeader className="bg-muted/40">
            <TableRow className="hover:bg-transparent [&_th]:h-11 [&_th]:px-4 [&_th]:text-xs [&_th]:font-semibold [&_th]:tracking-wide [&_th]:text-muted-foreground [&_th]:uppercase">
              <TableHead>Müşteri</TableHead>
              <TableHead>Durum</TableHead>
              <TableHead>Proje</TableHead>
              <TableHead>Lead</TableHead>
              <TableHead>Sorumlular</TableHead>
              <TableHead>Son güncelleme</TableHead>
              {canEdit && <TableHead />}
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow className="hover:bg-transparent">
                <TableCell colSpan={canEdit ? 7 : 6} className="p-0">
                  <EmptyState
                    icon={ListChecks}
                    title="Eşleşen kayıt yok"
                    description="Filtre veya aramayı değiştir."
                  />
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((row) => (
                <TableRow key={row.customerId} className="hover:bg-accent/60">
                  <TableCell className="px-4 py-2.5">
                    <Link
                      href={`/musteriler/${row.customerId}`}
                      className="font-medium underline-offset-4 transition-colors hover:text-primary hover:underline"
                    >
                      {row.name}
                    </Link>
                  </TableCell>
                  <TableCell className="px-4">
                    <StatusBadge status={row.record?.status ?? null} />
                  </TableCell>
                  <TableCell className="px-4 text-sm">
                    {row.record?.project ?? (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell className="px-4 text-sm">
                    {row.record?.lead ?? (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell
                    className="max-w-[16rem] truncate px-4 text-sm text-muted-foreground"
                    title={row.record?.responsibles ?? undefined}
                  >
                    {row.record?.responsibles ? (
                      row.record.responsibles
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell className="max-w-[24rem] truncate px-4 text-sm text-muted-foreground">
                    {row.lastUpdate ? row.lastUpdate.body : "-"}
                  </TableCell>
                  {canEdit && (
                    <TableCell className="px-4 text-right">
                      <TrackEdit
                        customerId={row.customerId}
                        name={row.name}
                        record={row.record}
                        defs={defs}
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

function Chip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={
        active
          ? "press inline-flex items-center gap-1.5 rounded-full bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground"
          : "press inline-flex items-center gap-1.5 rounded-full bg-card px-3 py-1.5 text-sm text-muted-foreground ring-1 ring-foreground/[0.06] transition-colors hover:text-foreground"
      }
    >
      {children}
    </button>
  );
}

function Count({ children }: { children: React.ReactNode }) {
  return <span className="text-xs opacity-70 tabular-nums">{children}</span>;
}
