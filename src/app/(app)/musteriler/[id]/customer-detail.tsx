import { compareVersion } from "@/lib/versions/drift";
import { rowDrift } from "@/lib/dashboard/compute";
import { StatusBadge, DriftBadge } from "@/components/status-badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { CustomerDetail } from "@/lib/customers/detail";
import type { InfraEntry } from "@/lib/infra/types";

const TONE: Record<string, string> = {
  current: "text-foreground",
  behind: "text-destructive font-medium",
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
    <div className="grid gap-6 lg:grid-cols-2">
      <Card className="lg:col-span-2">
        <CardHeader className="flex-row items-center justify-between">
          <CardTitle>Takip</CardTitle>
          <StatusBadge status={record?.status ?? null} />
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-2">
          <Field label="Proje" value={record?.project} />
          <Field label="Lead" value={record?.lead} />
          <Field label="Bilinen Sorumlular" value={record?.responsibles} />
          <Field label="Proje Kapsamı" value={record?.scope} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Son güncellemeler</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {updates.length === 0 ? (
            <p className="py-4 text-sm text-muted-foreground">Güncelleme yok.</p>
          ) : (
            updates.map((u) => (
              <div
                key={u.id}
                className="space-y-0.5 border-b pb-3 last:border-0 last:pb-0"
              >
                <p className="text-xs tabular-nums text-muted-foreground">
                  {u.week_date}
                </p>
                <p className="text-sm whitespace-pre-line">{u.body}</p>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Sürümler</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {versions.length === 0 ? (
            <p className="py-4 text-sm text-muted-foreground">
              Sürüm kaydı yok.
            </p>
          ) : (
            versions.map((v) => {
              const drift = rowDrift(
                { ...v, customerName: detail.customer.name },
                components,
              );
              return (
                <div
                  key={v.id}
                  className="space-y-2 border-b pb-4 last:border-0 last:pb-0"
                >
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium">
                      {v.system ?? "Sistem yok"}
                      {v.deployment ? (
                        <span className="text-muted-foreground">
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
                          <span className="text-muted-foreground">
                            {c.label}
                          </span>
                          <span className={`tabular-nums ${TONE[status]}`}>
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
        </CardContent>
      </Card>

      {showInfra ? (
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Altyapı &amp; Erişim</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {infra.length === 0 ? (
              <p className="py-4 text-sm text-muted-foreground">Kayıt yok.</p>
            ) : (
              infra.map((e) => (
                <div key={e.id} className="rounded-md border p-3">
                  <p className="text-sm font-medium">
                    {e.label}
                    <span className="text-muted-foreground"> · {e.type}</span>
                  </p>
                  <div className="mt-1 grid grid-cols-2 gap-x-4 gap-y-0.5 text-sm sm:grid-cols-3">
                    {e.fields.map((f) => (
                      <div key={f.key} className="flex justify-between gap-2">
                        <span className="text-muted-foreground">{f.label}</span>
                        <span>{f.sensitive ? "••••••" : f.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
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
