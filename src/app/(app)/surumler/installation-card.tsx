"use client";

import Link from "next/link";
import { Pencil, ArrowDown } from "lucide-react";
import { VersionEdit } from "./version-edit";
import { VersionDeleteButton } from "./version-delete";
import { compareVersion } from "@/lib/versions/drift";
import { isFeatureOn, type VersionCatalog } from "@/lib/versions/catalog";
import type { MatrixRow } from "@/lib/versions/types";
import type { FieldDefinition } from "@/lib/fields/types";

type Props = {
  row: MatrixRow;
  catalog: VersionCatalog;
  behind: number;
  defs: FieldDefinition[];
  canEdit: boolean;
  isAdmin: boolean;
};

export function InstallationCard({
  row,
  catalog,
  behind,
  defs,
  canEdit,
  isAdmin,
}: Props) {
  const installed = catalog.components
    .map((c) => ({ ...c, value: String(row.custom_fields?.[c.key] ?? "").trim() }))
    .filter((c) => c.value !== "");
  const features = catalog.features.filter((f) =>
    isFeatureOn(row.custom_fields?.[f.key]),
  );
  const note = catalog.note
    ? String(row.custom_fields?.[catalog.note.key] ?? "").trim()
    : "";

  return (
    <div className="bento bento-hover group relative flex flex-col gap-3 p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <Link
            href={`/musteriler/${row.customer_id}`}
            className="font-medium underline-offset-4 transition-colors hover:text-primary hover:underline"
          >
            {row.customerName}
          </Link>
          <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
            {row.system ? (
              <span className="rounded-md bg-muted px-1.5 py-0.5 font-medium text-foreground">
                {row.system}
              </span>
            ) : null}
            {row.deployment ? <span>{row.deployment}</span> : null}
            {row.os ? <span>· {row.os}</span> : null}
          </div>
        </div>
        <DriftBadge behind={behind} />
      </div>

      {installed.length > 0 ? (
        <div className="flex flex-wrap gap-1.5">
          {installed.map((c) => (
            <VersionChip
              key={c.key}
              label={c.label}
              value={c.value}
              behind={compareVersion(c.value, c.latest, c.kind) === "behind"}
            />
          ))}
        </div>
      ) : (
        <p className="text-xs text-muted-foreground">Bileşen sürümü girilmemiş.</p>
      )}

      {features.length > 0 ? (
        <div className="flex flex-wrap gap-1.5">
          {features.map((f) => (
            <span
              key={f.key}
              className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary"
            >
              <span className="size-1.5 rounded-full bg-primary" />
              {f.label}
            </span>
          ))}
        </div>
      ) : null}

      {note ? (
        <p className="line-clamp-2 text-xs text-muted-foreground">{note}</p>
      ) : null}

      {canEdit ? (
        <div className="row-rail absolute top-3 right-3 flex items-center gap-1">
          <VersionEdit
            customerId={row.customer_id}
            customerName={row.customerName}
            record={row}
            defs={defs}
            trigger={
              <button
                type="button"
                aria-label={`${row.customerName} sürüm kaydını düzenle`}
                className="press grid size-8 place-items-center rounded-lg bg-card/80 text-muted-foreground ring-1 ring-foreground/[0.06] backdrop-blur transition-colors hover:bg-accent hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
              >
                <Pencil className="size-4" />
              </button>
            }
          />
          {isAdmin ? (
            <VersionDeleteButton id={row.id} name={row.customerName} />
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

function DriftBadge({ behind }: { behind: number }) {
  if (behind > 0) {
    return (
      <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-[color-mix(in_oklch,var(--accent-rose)_16%,transparent)] px-2 py-0.5 text-xs font-semibold text-accent-rose">
        <ArrowDown className="size-3" />
        {behind} geride
      </span>
    );
  }
  return (
    <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-[color-mix(in_oklch,var(--accent-emerald)_14%,transparent)] px-2 py-0.5 text-xs font-medium text-accent-emerald">
      <span className="size-1.5 rounded-full bg-accent-emerald" />
      güncel
    </span>
  );
}

function VersionChip({
  label,
  value,
  behind,
}: {
  label: string;
  value: string;
  behind: boolean;
}) {
  return (
    <span
      className={
        behind
          ? "inline-flex items-center gap-1.5 rounded-lg bg-[color-mix(in_oklch,var(--accent-rose)_12%,transparent)] px-2 py-1 text-xs ring-1 ring-[color-mix(in_oklch,var(--accent-rose)_22%,transparent)]"
          : "inline-flex items-center gap-1.5 rounded-lg bg-muted/50 px-2 py-1 text-xs ring-1 ring-foreground/[0.04]"
      }
    >
      <span className="text-muted-foreground">{label}</span>
      <span
        className={
          behind
            ? "inline-flex items-center gap-0.5 font-mono font-semibold text-accent-rose"
            : "font-mono font-medium text-foreground"
        }
      >
        {behind ? <ArrowDown className="size-3" /> : null}
        {value}
      </span>
    </span>
  );
}
