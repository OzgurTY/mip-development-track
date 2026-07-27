"use client";

import { useEffect, useMemo, useState } from "react";
import { Layers, LayoutGrid, TableProperties, X } from "lucide-react";
import { SearchInput } from "@/components/search-input";
import { EmptyState } from "@/components/empty-state";
import { FacetFilter, type FacetOption } from "./facet-filter";
import { InstallationCard } from "./installation-card";
import { VersionTable } from "./version-table";
import { compareVersion } from "@/lib/versions/drift";
import type { VersionCatalog } from "@/lib/versions/catalog";
import type { MatrixRow } from "@/lib/versions/types";
import type { FieldDefinition } from "@/lib/fields/types";

type View = "cards" | "table";
const VIEW_KEY = "surumler-view";

/** Filtrelenebilir çekirdek boyutlar; seçenekler mevcut kayıtlardan türetilir. */
const DIMS = [
  { key: "system", label: "Sistem" },
  { key: "deployment", label: "Konum" },
  { key: "os", label: "İşletim sistemi" },
  { key: "status", label: "Durum" },
  { key: "package", label: "Paket" },
] as const;

type DimKey = (typeof DIMS)[number]["key"];
type Facets = Record<DimKey, string[]>;

const EMPTY_FACETS: Facets = {
  system: [],
  deployment: [],
  os: [],
  status: [],
  package: [],
};

type Props = {
  rows: MatrixRow[];
  catalog: VersionCatalog;
  defs: FieldDefinition[];
  canEdit: boolean;
  isAdmin: boolean;
};

export function VersionBoard({ rows, catalog, defs, canEdit, isAdmin }: Props) {
  const [query, setQuery] = useState("");
  const [facets, setFacets] = useState<Facets>(EMPTY_FACETS);
  const [behindOnly, setBehindOnly] = useState(false);
  const [view, setView] = useState<View>("cards");

  function toggleFacet(dim: DimKey, value: string) {
    setFacets((f) => ({
      ...f,
      [dim]: f[dim].includes(value)
        ? f[dim].filter((v) => v !== value)
        : [...f[dim], value],
    }));
  }

  function clearFacet(dim: DimKey) {
    setFacets((f) => ({ ...f, [dim]: [] }));
  }

  function clearAll() {
    setFacets(EMPTY_FACETS);
    setBehindOnly(false);
    setQuery("");
  }

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

  const facetOptions = useMemo(() => {
    const result = {} as Record<DimKey, FacetOption[]>;
    for (const dim of DIMS) {
      const counts = new Map<string, number>();
      for (const r of rows) {
        const v = r[dim.key];
        if (v) counts.set(v, (counts.get(v) ?? 0) + 1);
      }
      result[dim.key] = [...counts.entries()]
        .sort((a, b) => a[0].localeCompare(b[0], "tr"))
        .map(([value, count]) => ({ value, count }));
    }
    return result;
  }, [rows]);

  const behindInstalls = useMemo(
    () => [...behindByRow.values()].filter((b) => b > 0).length,
    [behindByRow],
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLocaleLowerCase("tr");
    return rows.filter((r) => {
      for (const dim of DIMS) {
        const sel = facets[dim.key];
        if (sel.length > 0 && !sel.includes(r[dim.key] ?? "")) return false;
      }
      if (behindOnly && (behindByRow.get(r.id) ?? 0) === 0) return false;
      if (q) {
        // Müşteri adının yanında çekirdek alanlar ve bileşen değerleri de
        // aranır; "windows", "prod" veya bir sürüm numarası yazmak yeterli.
        const haystack = [
          r.customerName,
          r.system,
          r.deployment,
          r.os,
          r.status,
          r.middleware,
          r.package,
          ...Object.values(r.custom_fields ?? {}).map(String),
        ]
          .filter(Boolean)
          .join(" ")
          .toLocaleLowerCase("tr");
        if (!haystack.includes(q)) return false;
      }
      return true;
    });
  }, [rows, query, facets, behindOnly, behindByRow]);

  const facetCount = DIMS.reduce((a, d) => a + facets[d.key].length, 0);
  const hasFilter = Boolean(query || facetCount > 0 || behindOnly);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <SearchInput
          value={query}
          onChange={setQuery}
          placeholder="Müşteri, OS, sistem, sürüm ara..."
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
        <div className="flex flex-wrap items-center gap-1.5">
          {DIMS.filter((d) => facetOptions[d.key].length > 0).map((d) => (
            <FacetFilter
              key={d.key}
              label={d.label}
              options={facetOptions[d.key]}
              selected={facets[d.key]}
              onToggle={(v) => toggleFacet(d.key, v)}
              onClear={() => clearFacet(d.key)}
            />
          ))}
          <Chip active={behindOnly} onClick={() => setBehindOnly((v) => !v)} danger>
            Sadece geride <Count>{behindInstalls}</Count>
          </Chip>
          {hasFilter ? (
            <button
              type="button"
              onClick={clearAll}
              className="press inline-flex items-center gap-1 rounded-full px-2.5 py-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              <X className="size-3.5" />
              Temizle
            </button>
          ) : null}
        </div>
        <div className="ml-auto flex flex-wrap items-center gap-x-5 gap-y-1.5">
          <Stat
            value={hasFilter ? filtered.length : rows.length}
            label={hasFilter ? `/ ${rows.length} kurulum` : "kurulum"}
          />
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
