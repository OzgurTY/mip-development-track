import Link from "next/link";
import { getOverview } from "@/lib/dashboard/queries";
import { MetricCard } from "@/components/metric-card";
import { DriftBadge } from "@/components/status-badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function DashboardPage() {
  const { counts, mostBehind, attention, recent } = await getOverview();
  const behindInstalls = mostBehind.length;
  const attentionCount = attention.length;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold">Genel Bakış</h1>
        <p className="text-sm text-muted-foreground">
          Cuma toplantısı için tek bakışta durum.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <MetricCard
          label="Müşteri"
          value={counts.total}
          hint={`${counts.active} aktif`}
        />
        <MetricCard
          label="Geride kurulum"
          value={behindInstalls}
          hint="güncel sürümün gerisinde"
        />
        <MetricCard
          label="Dikkat isteyen"
          value={attentionCount}
          hint="durum veya drift"
        />
        <MetricCard
          label="Beklemede"
          value={counts.byStatus["Beklemede"] ?? 0}
          hint="takip durumu"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>En çok geride kalan kurulumlar</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1">
            {mostBehind.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">
                Geride kalan kurulum yok.
              </p>
            ) : (
              mostBehind.map((d) => (
                <Link
                  key={d.customerId + (d.system ?? "")}
                  href={`/musteriler/${d.customerId}`}
                  className="flex items-center justify-between rounded-md px-2 py-2 transition-colors hover:bg-accent"
                >
                  <span className="text-sm">
                    <span className="font-medium">{d.customerName}</span>
                    {d.system ? (
                      <span className="text-muted-foreground"> · {d.system}</span>
                    ) : null}
                  </span>
                  <DriftBadge behind={d.behind} />
                </Link>
              ))
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Son güncellemeler</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {recent.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">
                Henüz güncelleme yok.
              </p>
            ) : (
              recent.map((u) => (
                <div
                  key={u.id}
                  className="space-y-0.5 border-b pb-3 last:border-0 last:pb-0"
                >
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span className="font-medium text-foreground">
                      {u.customerName}
                    </span>
                    <span className="tabular-nums">{u.weekDate}</span>
                  </div>
                  <p className="line-clamp-2 text-sm">{u.body}</p>
                  {u.author ? (
                    <p className="text-xs text-muted-foreground">{u.author}</p>
                  ) : null}
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Dikkat isteyen müşteriler</CardTitle>
        </CardHeader>
        <CardContent className="space-y-1">
          {attention.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">
              Dikkat isteyen müşteri yok.
            </p>
          ) : (
            attention.map((a) => (
              <Link
                key={a.customerId}
                href={`/musteriler/${a.customerId}`}
                className="flex items-center justify-between rounded-md px-2 py-2 transition-colors hover:bg-accent"
              >
                <span className="text-sm font-medium">{a.customerName}</span>
                <span className="text-xs text-muted-foreground">{a.reason}</span>
              </Link>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
