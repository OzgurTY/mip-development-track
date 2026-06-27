import { ListChecks, Clock, Layers, ServerCog } from "lucide-react";
import { compareVersion } from "@/lib/versions/drift";
import { rowDrift } from "@/lib/dashboard/compute";
import { DriftBadge } from "@/components/status-badge";
import { BentoCard } from "@/components/bento-card";
import { Button } from "@/components/ui/button";
import { TrackEdit } from "../../takip/track-edit";
import { VersionEdit } from "../../surumler/version-edit";
import { EntryForm } from "../../altyapi/entry-form";
import { EntryCard } from "../../altyapi/entry-card";
import type { CustomerDetail } from "@/lib/customers/detail";
import type { InfraEntry } from "@/lib/infra/types";
import type { FieldDefinition } from "@/lib/fields/types";
import type { VersionRecord } from "@/lib/versions/types";

const TONE: Record<string, string> = {
  current: "text-foreground",
  behind: "font-semibold text-accent-rose",
  ahead: "text-foreground",
  unknown: "text-muted-foreground",
};

type Props = {
  detail: CustomerDetail;
  infra: InfraEntry[];
  showInfra: boolean;
  canEdit: boolean;
  canDelete: boolean;
  trackDefs: FieldDefinition[];
  versionDefs: FieldDefinition[];
  infraDefs: FieldDefinition[];
};

export function CustomerDetailView({
  detail,
  infra,
  showInfra,
  canEdit,
  canDelete,
  trackDefs,
  versionDefs,
  infraDefs,
}: Props) {
  const { record, updates, versions, components, customer } = detail;
  const componentKeys = new Set(components.map((c) => c.key));
  const boolDefs = versionDefs.filter((d) => d.type === "boolean");
  const otherDefs = versionDefs.filter(
    (d) => d.type !== "boolean" && !componentKeys.has(d.key),
  );

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <BentoCard
        title="Takip"
        icon={ListChecks}
        hover
        className="lg:col-span-2"
        action={
          canEdit ? (
            <TrackEdit
              customerId={customer.id}
              name={customer.name}
              record={record}
              defs={trackDefs}
            />
          ) : undefined
        }
        bodyClassName="grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
      >
        <Field label="Proje" value={record?.project} />
        <Field label="Lead" value={record?.lead} />
        <Field label="Bilinen Sorumlular" value={record?.responsibles} />
        <Field label="Proje Kapsamı" value={record?.scope} />
      </BentoCard>

      <BentoCard
        title="Son güncellemeler"
        icon={Clock}
        hover
        bodyClassName="space-y-3"
      >
        {updates.length === 0 ? (
          <Empty>Güncelleme yok.</Empty>
        ) : (
          updates.map((u) => (
            <div key={u.id} className="relative border-l-2 border-border pl-3.5">
              <span className="absolute top-1.5 -left-[5px] size-2 rounded-full bg-primary" />
              <p className="text-xs tabular-nums text-muted-foreground">
                {u.week_date}
              </p>
              <p className="text-sm whitespace-pre-line">{u.body}</p>
            </div>
          ))
        )}
      </BentoCard>

      <BentoCard
        title="Sürümler"
        icon={Layers}
        hover
        action={
          canEdit ? (
            <VersionEdit
              customerId={customer.id}
              customerName={customer.name}
              record={null}
              defs={versionDefs}
              trigger={
                <Button variant="outline" size="sm" className="press">
                  Yeni ortam
                </Button>
              }
            />
          ) : undefined
        }
        bodyClassName="space-y-4"
      >
        {versions.length === 0 ? (
          <Empty>Sürüm kaydı yok.</Empty>
        ) : (
          versions.map((v) => {
            const drift = rowDrift(
              { ...v, customerName: customer.name },
              components,
            );
            return (
              <div key={v.id} className="rounded-2xl bg-muted/40 p-3.5">
                <div className="mb-2.5 flex items-center justify-between gap-2">
                  <p className="text-sm font-semibold">
                    {v.system ?? "Sistem yok"}
                    {v.deployment ? (
                      <span className="font-normal text-muted-foreground">
                        {" "}
                        · {v.deployment}
                      </span>
                    ) : null}
                  </p>
                  <div className="flex items-center gap-2">
                    <DriftBadge behind={drift.behind} />
                    {canEdit ? (
                      <VersionEdit
                        customerId={customer.id}
                        customerName={customer.name}
                        record={v}
                        defs={versionDefs}
                        trigger={
                          <Button variant="ghost" size="sm" className="press">
                            Düzenle
                          </Button>
                        }
                      />
                    ) : null}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm sm:grid-cols-3">
                  {components.map((c) => {
                    const installed = String(v.custom_fields?.[c.key] ?? "");
                    const status = compareVersion(
                      installed,
                      c.latest_version,
                      c.kind,
                    );
                    return (
                      <div key={c.key} className="flex justify-between gap-2">
                        <span className="text-muted-foreground">{c.label}</span>
                        <span className={`font-mono text-xs ${TONE[status]}`}>
                          {installed || "-"}
                        </span>
                      </div>
                    );
                  })}
                  {otherDefs.map((d) => {
                    const val = String(v.custom_fields?.[d.key] ?? "");
                    if (!val) return null;
                    return (
                      <div key={d.key} className="flex justify-between gap-2">
                        <span className="text-muted-foreground">{d.label}</span>
                        <span className="font-mono text-xs">{val}</span>
                      </div>
                    );
                  })}
                </div>

                {boolDefs.length > 0 ? (
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {boolDefs.map((d) => (
                      <FeatureChip
                        key={d.key}
                        label={d.label}
                        on={isOn(v, d.key)}
                      />
                    ))}
                  </div>
                ) : null}
              </div>
            );
          })
        )}
      </BentoCard>

      {showInfra ? (
        <BentoCard
          title="Altyapı ve Erişim"
          icon={ServerCog}
          hover
          className="lg:col-span-2"
          action={
            canEdit ? (
              <EntryForm customerId={customer.id} defs={infraDefs} />
            ) : undefined
          }
          bodyClassName="grid gap-4 sm:grid-cols-2"
        >
          {infra.length === 0 ? (
            <Empty>Kayıt yok.</Empty>
          ) : (
            infra.map((e) => (
              <EntryCard key={e.id} entry={e} canDelete={canDelete} />
            ))
          )}
        </BentoCard>
      ) : null}
    </div>
  );
}

function isOn(v: VersionRecord, key: string): boolean {
  const raw = v.custom_fields?.[key];
  return raw === true || raw === "true";
}

function FeatureChip({ label, on }: { label: string; on: boolean }) {
  const color = on ? "var(--accent-emerald)" : "var(--muted-foreground)";
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium"
      style={{
        background: `color-mix(in oklch, ${color} 14%, transparent)`,
        boxShadow: `inset 0 0 0 1px color-mix(in oklch, ${color} 30%, transparent)`,
      }}
    >
      <span className="size-1.5 rounded-full" style={{ background: color }} />
      {label}
      <span className="text-muted-foreground">{on ? "Var" : "Yok"}</span>
    </span>
  );
}

function Field({
  label,
  value,
}: {
  label: string;
  value: string | null | undefined;
}) {
  return (
    <div className="space-y-0.5">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-sm whitespace-pre-line">{value || "-"}</p>
    </div>
  );
}

function Empty({ children }: { children: React.ReactNode }) {
  return <p className="py-4 text-sm text-muted-foreground">{children}</p>;
}
