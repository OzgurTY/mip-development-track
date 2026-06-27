import Link from "next/link";
import {
  Building2,
  TrendingDown,
  TriangleAlert,
  Layers,
  Activity,
  Clock,
  ChevronRight,
  PieChart as PieIcon,
} from "lucide-react";
import { getOverview } from "@/lib/dashboard/queries";
import { StatTile } from "@/components/stat-tile";
import { BentoCard } from "@/components/bento-card";
import { DriftBadge } from "@/components/status-badge";
import {
  StatusDonut,
  ComponentBars,
  type Slice,
} from "@/components/charts/dashboard-charts";

const STATUS_META: { key: string; color: string }[] = [
  { key: "Aktif", color: "var(--accent-emerald)" },
  { key: "Stabil", color: "var(--accent-sky)" },
  { key: "Beklemede", color: "var(--accent-amber)" },
  { key: "İnaktif", color: "var(--accent-rose)" },
  { key: "Durum yok", color: "var(--muted-foreground)" },
];

export default async function DashboardPage() {
  const { counts, mostBehind, attention, recent, components, versionCount } =
    await getOverview();

  const slices: Slice[] = STATUS_META.map((s) => ({
    name: s.key,
    value: counts.byStatus[s.key] ?? 0,
    color: s.color,
  })).filter((s) => s.value > 0);

  const bars = components
    .filter((c) => c.current + c.behind > 0)
    .map((c) => ({
      label: c.label,
      current: c.current,
      behind: c.behind,
      unknown: c.unknown,
    }));

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl font-bold tracking-tight">
            Genel Bakış
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Cuma toplantısı için tek bakışta durum.
          </p>
        </div>
      </header>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatTile
          label="Müşteri"
          value={counts.total}
          icon={Building2}
          accent="indigo"
          hint={`${counts.active} aktif`}
        />
        <StatTile
          label="Geride kurulum"
          value={mostBehind.length}
          icon={TrendingDown}
          accent="rose"
          hint="güncel sürümün gerisinde"
        />
        <StatTile
          label="Dikkat isteyen"
          value={attention.length}
          icon={TriangleAlert}
          accent="amber"
          hint="durum veya drift"
        />
        <StatTile
          label="Sürüm kaydı"
          value={versionCount}
          icon={Layers}
          accent="sky"
          hint="ortam kaydı"
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <BentoCard
          title="Bileşen sürüm durumu"
          icon={Layers}
          hover
          className="animate-in fade-in slide-in-from-bottom-2 duration-500 lg:col-span-2"
        >
          {bars.length === 0 ? (
            <Empty>Sürüm verisi yok.</Empty>
          ) : (
            <>
              <ComponentBars data={bars} />
              <Legend
                items={[
                  { label: "Güncel", color: "var(--accent-emerald)" },
                  { label: "Geride", color: "var(--accent-rose)" },
                  { label: "Kurulu değil", color: "var(--muted)" },
                ]}
              />
            </>
          )}
        </BentoCard>

        <BentoCard
          title="Durum dağılımı"
          icon={PieIcon}
          hover
          className="animate-in fade-in slide-in-from-bottom-2 duration-500 [animation-delay:80ms]"
        >
          {slices.length === 0 ? (
            <Empty>Takip verisi yok.</Empty>
          ) : (
            <>
              <StatusDonut data={slices} total={counts.total} />
              <Legend
                items={slices.map((s) => ({
                  label: `${s.name} (${s.value})`,
                  color: s.color,
                }))}
              />
            </>
          )}
        </BentoCard>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <BentoCard
          title="En çok geride kalan"
          icon={TrendingDown}
          hover
          className="animate-in fade-in slide-in-from-bottom-2 duration-500"
          bodyClassName="space-y-1"
        >
          {mostBehind.length === 0 ? (
            <Empty>Geride kalan kurulum yok.</Empty>
          ) : (
            mostBehind.map((d) => (
              <Row key={d.customerId + (d.system ?? "")} href={`/musteriler/${d.customerId}`}>
                <span className="truncate text-sm">
                  <span className="font-medium">{d.customerName}</span>
                  {d.system ? (
                    <span className="text-muted-foreground"> · {d.system}</span>
                  ) : null}
                </span>
                <DriftBadge behind={d.behind} />
              </Row>
            ))
          )}
        </BentoCard>

        <BentoCard
          title="Son güncellemeler"
          icon={Clock}
          hover
          className="animate-in fade-in slide-in-from-bottom-2 duration-500 [animation-delay:80ms] lg:col-span-2"
          bodyClassName="space-y-3"
        >
          {recent.length === 0 ? (
            <Empty>Henüz güncelleme yok.</Empty>
          ) : (
            recent.map((u) => (
              <div
                key={u.id}
                className="space-y-1 border-b border-border/60 pb-3 last:border-0 last:pb-0"
              >
                <div className="flex items-center justify-between gap-3 text-xs">
                  <span className="font-semibold">{u.customerName}</span>
                  <span className="tabular-nums text-muted-foreground">
                    {u.weekDate}
                  </span>
                </div>
                <p className="line-clamp-2 text-sm text-muted-foreground">
                  {u.body}
                </p>
              </div>
            ))
          )}
        </BentoCard>
      </div>

      <BentoCard
        title="Dikkat isteyen müşteriler"
        icon={TriangleAlert}
        hover
        className="animate-in fade-in slide-in-from-bottom-2 duration-500"
        bodyClassName="grid gap-1 sm:grid-cols-2"
      >
        {attention.length === 0 ? (
          <Empty>Dikkat isteyen müşteri yok.</Empty>
        ) : (
          attention.map((a) => (
            <Row key={a.customerId} href={`/musteriler/${a.customerId}`}>
              <span className="flex items-center gap-2 truncate text-sm font-medium">
                <Activity className="size-3.5 shrink-0 text-accent-amber" />
                {a.customerName}
              </span>
              <span className="shrink-0 text-xs text-muted-foreground">
                {a.reason}
              </span>
            </Row>
          ))
        )}
      </BentoCard>
    </div>
  );
}

function Row({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="press flex items-center justify-between gap-3 rounded-xl px-2.5 py-2 transition-colors hover:bg-accent"
    >
      {children}
      <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
    </Link>
  );
}

function Legend({ items }: { items: { label: string; color: string }[] }) {
  return (
    <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5">
      {items.map((it) => (
        <span key={it.label} className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <span className="size-2.5 rounded-full" style={{ background: it.color }} />
          {it.label}
        </span>
      ))}
    </div>
  );
}

function Empty({ children }: { children: React.ReactNode }) {
  return (
    <p className="grid h-full min-h-24 place-items-center text-center text-sm text-muted-foreground">
      {children}
    </p>
  );
}
