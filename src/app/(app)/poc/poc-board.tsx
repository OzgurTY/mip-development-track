"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { FlaskConical } from "lucide-react";
import { PocDeleteButton } from "./poc-delete";
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
import { formatRange } from "@/lib/poc/format";
import { POC_STATUSES, type PocListRow } from "@/lib/poc/types";

type Props = {
  rows: PocListRow[];
  canEdit: boolean;
};

export function PocBoard({ rows, canEdit }: Props) {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<string | null>(null);

  const counts = useMemo(() => {
    const map: Record<string, number> = {};
    for (const row of rows) map[row.status] = (map[row.status] ?? 0) + 1;
    return map;
  }, [rows]);

  const filtered = useMemo(() => {
    const q = query.trim().toLocaleLowerCase("tr");
    return rows.filter((row) => {
      if (status && row.status !== status) return false;
      if (!q) return true;
      return (
        row.customerName.toLocaleLowerCase("tr").includes(q) ||
        row.title.toLocaleLowerCase("tr").includes(q)
      );
    });
  }, [rows, query, status]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <SearchInput
          value={query}
          onChange={setQuery}
          placeholder="Müşteri veya PoC konusu ara..."
          className="w-full max-w-xs"
        />
        <div className="flex flex-wrap gap-1.5">
          <Chip active={status === null} onClick={() => setStatus(null)}>
            Tümü <Count>{rows.length}</Count>
          </Chip>
          {POC_STATUSES.map((s) => (
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
              <TableHead>
                {canEdit ? <span className="pl-10">Müşteri / PoC</span> : "Müşteri / PoC"}
              </TableHead>
              <TableHead>Durum</TableHead>
              <TableHead>Sonuç</TableHead>
              <TableHead>Tarih</TableHead>
              <TableHead>Süreç</TableHead>
              <TableHead>Kriter</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow className="hover:bg-transparent">
                <TableCell colSpan={6} className="p-0">
                  <EmptyState
                    icon={FlaskConical}
                    title={rows.length === 0 ? "Henüz PoC yok" : "Eşleşen PoC yok"}
                    description={
                      rows.length === 0
                        ? "Yeni PoC oluşturduğunuzda standart iş adımları ve kabul kriterleri hazır gelir."
                        : "Filtre veya aramayı değiştir."
                    }
                  />
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((row) => (
                <TableRow key={row.id} className="group hover:bg-accent/60">
                  <TableCell
                    className={canEdit ? "relative py-2.5 pr-4 pl-14" : "px-4 py-2.5"}
                  >
                    <Link
                      href={`/poc/${row.id}`}
                      className="font-medium underline-offset-4 transition-colors hover:text-primary hover:underline"
                    >
                      {row.customerName}
                    </Link>
                    <p className="mt-0.5 text-sm text-muted-foreground">
                      {row.title}
                    </p>
                    {canEdit && (
                      <span className="row-rail absolute inset-y-0 left-2 flex items-center">
                        <PocDeleteButton
                          id={row.id}
                          label={`${row.customerName} - ${row.title}`}
                        />
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="px-4">
                    <StatusBadge status={row.status} />
                  </TableCell>
                  <TableCell className="px-4">
                    <StatusBadge status={row.result} />
                  </TableCell>
                  <TableCell className="px-4 text-sm whitespace-nowrap">
                    {formatRange(row.start_date, row.end_date)}
                  </TableCell>
                  <TableCell className="px-4 text-sm">
                    {row.processCount || "-"}
                  </TableCell>
                  <TableCell className="px-4 text-sm whitespace-nowrap">
                    {row.criteriaTotal > 0
                      ? `${row.criteriaMet} / ${row.criteriaTotal}`
                      : "-"}
                  </TableCell>
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
      aria-pressed={active}
      className={
        active
          ? "press inline-flex items-center gap-1.5 rounded-full bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground"
          : "press inline-flex items-center gap-1.5 rounded-full bg-card px-3 py-1.5 text-sm text-muted-foreground ring-1 ring-foreground/[0.08] transition-colors hover:text-foreground"
      }
    >
      {children}
    </button>
  );
}

function Count({ children }: { children: React.ReactNode }) {
  return <span className="text-xs opacity-70">{children}</span>;
}
