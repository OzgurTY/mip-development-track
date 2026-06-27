import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft, Layers, TrendingDown, Clock } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getCustomerDetail } from "@/lib/customers/detail";
import { getInfraEntries } from "@/lib/infra/queries";
import { rowDrift } from "@/lib/dashboard/compute";
import { CustomerDetailView } from "./customer-detail";
import { StatusBadge } from "@/components/status-badge";
import { Avatar } from "@/components/avatar";
import type { InfraEntry } from "@/lib/infra/types";

export default async function CustomerDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const detail = await getCustomerDetail(id);
  if (!detail) notFound();

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user!.id)
    .single();
  const role = profile?.role ?? "viewer";
  const showInfra = role === "admin" || role === "editor";
  const infra: InfraEntry[] = showInfra ? await getInfraEntries(id) : [];

  const totalBehind = detail.versions.reduce(
    (sum, v) =>
      sum +
      rowDrift({ ...v, customerName: detail.customer.name }, detail.components)
        .behind,
    0,
  );
  const lastUpdate = detail.updates[0]?.week_date ?? null;

  return (
    <div className="space-y-6">
      <Link
        href="/musteriler"
        className="press inline-flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ChevronLeft className="size-4" />
        Müşteriler
      </Link>

      <section className="bento relative overflow-hidden p-6">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{
            backgroundImage:
              "radial-gradient(420px 180px at 0% 0%, color-mix(in oklch, var(--accent-indigo) 12%, transparent), transparent)",
          }}
        />
        <div className="relative flex flex-wrap items-center gap-4">
          <Avatar
            name={detail.customer.name}
            className="size-14 text-lg"
          />
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2.5">
              <h1 className="font-display text-2xl font-bold tracking-tight">
                {detail.customer.name}
              </h1>
              <StatusBadge status={detail.record?.status ?? null} />
              {!detail.customer.is_active ? (
                <span className="rounded-full bg-muted px-2.5 py-0.5 text-xs text-muted-foreground">
                  Pasif
                </span>
              ) : null}
            </div>
            {detail.record?.project ? (
              <p className="mt-1 text-sm text-muted-foreground">
                {detail.record.project}
                {detail.record.lead ? ` · ${detail.record.lead}` : ""}
              </p>
            ) : null}
          </div>

          <div className="ml-auto grid grid-cols-3 gap-2.5">
            <HeroStat icon={Layers} label="Ortam" value={detail.versions.length} accent="var(--accent-sky)" />
            <HeroStat
              icon={TrendingDown}
              label="Geride"
              value={totalBehind}
              accent="var(--accent-rose)"
            />
            <HeroStat
              icon={Clock}
              label="Son not"
              value={lastUpdate ?? "-"}
              accent="var(--accent-emerald)"
              small={!!lastUpdate}
            />
          </div>
        </div>
      </section>

      <CustomerDetailView detail={detail} infra={infra} showInfra={showInfra} />
    </div>
  );
}

function HeroStat({
  icon: Icon,
  label,
  value,
  accent,
  small,
}: {
  icon: typeof Layers;
  label: string;
  value: number | string;
  accent: string;
  small?: boolean;
}) {
  return (
    <div className="min-w-20 rounded-2xl bg-muted/50 px-3.5 py-2.5">
      <Icon className="size-4" style={{ color: accent }} />
      <p
        className={`mt-1.5 font-display font-bold tabular-nums ${small ? "text-sm" : "text-xl"}`}
      >
        {value}
      </p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  );
}
