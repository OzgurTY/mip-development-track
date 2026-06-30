"use client";

import { useEffect, useMemo, useState } from "react";
import { Layers, LayoutGrid, TableProperties } from "lucide-react";
import { SearchInput } from "@/components/search-input";
import { EmptyState } from "@/components/empty-state";
import { InstallationCard } from "./installation-card";
import { VersionTable } from "./version-table";
import { compareVersion } from "@/lib/versions/drift";
import type { VersionCatalog } from "@/lib/versions/catalog";
import type { MatrixRow } from "@/lib/versions/types";
import type { FieldDefinition } from "@/lib/fields/types";

type View = "cards" | "table";
const VIEW_KEY = "surumler-view";

type Props = {
  rows: MatrixRow[];
  catalog: VersionCatalog;
  defs: FieldDefinition[];
  canEdit: boolean;
  isAdmin: boolean;
};

export function VersionBoard({ rows, catalog, defs, canEdit, isAdmin }: Props) {
  const [query, setQuery] = useState("");
  const [system, setSystem] = useState<string | null>(null);
  const [behindOnly, setBehindOnly] = useState(false);
  const [view, setView] = useState<View>("cards");

  // Remember the chosen view across visits (avoids hydration mismatch by
  // reading after mount).
  useEffect(() => {
    const saved = window.localStorage.getItem(VIEW_KEY);
    if (saved === "cards" || saved === "table") setView(saved);
  }, []);

  function chooseView(next: View) {
    setView(next);
    window.localStorage.setItem(VIEW_KEY, next);
  }

  const behindByRow = useMemo(() => {
    const m = new Map<string, number>();
    for (const r of rows) {
      let b = 0;
      for (const c of catalog.components) {
        if (
          c.latest &&
          compareVersion(
            String(r.custom_fields?.[c.key] ?? ""),
            c.latest,
            c.kind,
          ) === "behind"
        )
          b++;
      }
      m.set(r.id, b);
    }
    return m;
  }, [rows, catalog]);

  const systems = useMemo(() => {
    const set = new Set<string>();
    for (const r of rows) if (r.system) set.add(r.system);
    return [...set].sort((a, b) => a.localeCompare(b, "tr"));
  }, [rows]);

  const behindInstalls = useMemo(
    () => [...behindByRow.values()].filter((b) => b > 0).length,
    [behindByRow],
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLocaleLowerCase("tr");
    return rows.filter((r) => {
      if (system && r.system !== system) return false;
      if (behindOnly && (behindByRow.get(r.id) ?? 0) === 0) return false;
      if (q && !r.customerName.toLocaleLowerCase("tr").includes(q)) return false;
      return true;
    });
  }, [rows, query, system, behindOnly, behindByRow]);

  const hasFilter = Boolean(query || system || behindOnly);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <SearchInput
          value={query}
          onChange={setQuery}
          placeholder="Müşteri ara..."
          className="w-full max-w-xs"
        />
        <div className="ml-auto flex items-center gap-1 rounded-xl bg-muted/60 p-1 ring-1 ring-foreground/[0.05]">
          <ViewButton
            active={view === "cards"}
            onClick={() => chooseView("cards")}
            icon={LayoutGrid}
            label="Kart"
          />
          <ViewButton
            active={view === "table"}
            onClick={() => chooseView("table")}
            icon={TableProperties}
            label="Liste"
          />
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-x-5 gap-y-3">
        <div className="flex flex-wrap gap-1.5">
          <Chip
            active={system === null && !behindOnly}
            onClick={() => {
              setSystem(null);
              setBehindOnly(false);
            }}
          >
            Tümü <Count>{rows.length}</Count>
          </Chip>
          {systems.map((s) => (
            <Chip
              key={s}
              active={system === s}
              onClick={() => setSystem(system === s ? null : s)}
            >
              {s}
            </Chip>
          ))}
          <Chip active={behindOnly} onClick={() => setBehindOnly((v) => !v)} danger>
            Sadece geride <Count>{behindInstalls}</Count>
          </Chip>
        </div>
        <div className="ml-auto flex flex-wrap items-center gap-x-5 gap-y-1.5">
          <Stat value={rows.length} label="kurulum" />
          <Stat
            value={rows.length - behindInstalls}
            label="güncel"
            tone="var(--accent-emerald)"
          />
          <Stat value={behindInstalls} label="geride" tone="var(--accent-rose)" />
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="bento overflow-hidden">
          <EmptyState
            icon={Layers}
            title={hasFilter ? "Eşleşen kurulum yok" : "Henüz sürüm kaydı yok"}
            description={hasFilter ? "Filtreleri değiştir." : undefined}
          />
        </div>
      ) : view === "cards" ? (
        <div className="grid gap-4 lg:grid-cols-2 2xl:grid-cols-3">
          {filtered.map((row) => (
            <InstallationCard
              key={row.id}
              row={row}
              catalog={catalog}
              behind={behindByRow.get(row.id) ?? 0}
              defs={defs}
              canEdit={canEdit}
              isAdmin={isAdmin}
            />
          ))}
        </div>
      ) : (
        <VersionTable
          rows={filtered}
          catalog={catalog}
          defs={defs}
          canEdit={canEdit}
        />
      )}
    </div>
  );
}

function ViewButton({
  active,
  onClick,
  icon: Icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={
        active
          ? "press inline-flex items-center gap-1.5 rounded-lg bg-card px-2.5 py-1.5 text-sm font-medium shadow-sm ring-1 ring-foreground/[0.06]"
          : "press inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
      }
    >
      <Icon className="size-4" />
      {label}
    </button>
  );
}

function Chip({
  active,
  onClick,
  danger,
  children,
}: {
  active: boolean;
  onClick: () => void;
  danger?: boolean;
  children: React.ReactNode;
}) {
  if (active) {
    return (
      <button
        type="button"
        onClick={onClick}
        className={
          danger
            ? "press inline-flex items-center gap-1.5 rounded-full bg-accent-rose px-3 py-1.5 text-sm font-medium text-white"
            : "press inline-flex items-center gap-1.5 rounded-full bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground"
        }
      >
        {children}
      </button>
    );
  }
  return (
    <button
      type="button"
      onClick={onClick}
      className="press inline-flex items-center gap-1.5 rounded-full bg-card px-3 py-1.5 text-sm text-muted-foreground ring-1 ring-foreground/[0.06] transition-colors hover:text-foreground"
    >
      {children}
    </button>
  );
}

function Count({ children }: { children: React.ReactNode }) {
  return <span className="text-xs opacity-70 tabular-nums">{children}</span>;
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
