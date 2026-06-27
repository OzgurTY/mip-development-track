import { ListChecks, Clock, Layers, ServerCog } from "lucide-react";
import { compareVersion } from "@/lib/versions/drift";
import { rowDrift } from "@/lib/dashboard/compute";
import { DriftBadge } from "@/components/status-badge";
import { BentoCard } from "@/components/bento-card";
import type { CustomerDetail } from "@/lib/customers/detail";
import type { InfraEntry } from "@/lib/infra/types";

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
};

export function CustomerDetailView({ detail, infra, showInfra }: Props) {
  const { record, updates, versions, components } = detail;

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <BentoCard
        title="Takip"
        icon={ListChecks}
        hover
        className="lg:col-span-2"
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
            <div
              key={u.id}
              className="relative border-l-2 border-border pl-3"
            >
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
        bodyClassName="space-y-4"
      >
        {versions.length === 0 ? (
          <Empty>Sürüm kaydı yok.</Empty>
        ) : (
          versions.map((v) => {
            const drift = rowDrift(
              { ...v, customerName: detail.customer.name },
              components,
            );
            return (
              <div
                key={v.id}
                className="rounded-2xl bg-muted/40 p-3.5"
              >
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
                  <DriftBadge behind={drift.behind} />
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
                </div>
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
          bodyClassName="grid gap-3 sm:grid-cols-2"
        >
          {infra.length === 0 ? (
            <Empty>Kayıt yok.</Empty>
          ) : (
            infra.map((e) => (
              <div key={e.id} className="rounded-2xl bg-muted/40 p-3.5">
                <p className="text-sm font-semibold">
                  {e.label}
                  <span className="font-normal text-muted-foreground">
                    {" "}
                    · {e.type}
                  </span>
                </p>
                <div className="mt-1.5 grid grid-cols-2 gap-x-4 gap-y-0.5 text-sm">
                  {e.fields.map((f) => (
                    <div key={f.key} className="flex justify-between gap-2">
                      <span className="text-muted-foreground">{f.label}</span>
                      <span className="font-mono text-xs">
                        {f.sensitive ? "••••••" : f.value}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ))
          )}
        </BentoCard>
      ) : null}
    </div>
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
