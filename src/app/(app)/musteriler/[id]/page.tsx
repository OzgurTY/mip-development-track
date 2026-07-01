import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft, Layers, TrendingDown, Clock, Building2 } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getCustomerDetail } from "@/lib/customers/detail";
import { getInfraEntries } from "@/lib/infra/queries";
import { getInfraTypes } from "@/lib/infra/type-queries";
import { getFieldDefinitions } from "@/lib/fields/queries";
import { rowDrift } from "@/lib/dashboard/compute";
import { CustomerDetailView } from "./customer-detail";
import { CustomerDialog } from "../customer-dialog";
import { DeleteCustomerAction } from "./delete-customer";
import { StatusBadge } from "@/components/status-badge";
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
  const canEdit = role === "admin" || role === "editor";
  const showInfra = canEdit;

  const [customerDefs, trackDefs, versionDefs, infraDefs, infraTypes] =
    await Promise.all([
      getFieldDefinitions("customer"),
      getFieldDefinitions("track"),
      getFieldDefinitions("version"),
      getFieldDefinitions("infra"),
      getInfraTypes(),
    ]);
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
        <div className="relative flex flex-wrap items-center gap-4">
          <span className="grid size-12 place-items-center rounded-2xl bg-muted text-muted-foreground">
            <Building2 className="size-6" strokeWidth={2} />
          </span>
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

          <div className="ml-auto flex items-center gap-2.5">
            <div className="hidden gap-2.5 sm:flex">
              <HeroStat icon={Layers} label="Ortam" value={detail.versions.length} accent="var(--accent-sky)" />
              <HeroStat icon={TrendingDown} label="Geride" value={totalBehind} accent="var(--accent-rose)" />
              <HeroStat icon={Clock} label="Son not" value={lastUpdate ?? "-"} accent="var(--accent-emerald)" small={!!lastUpdate} />
            </div>
            {canEdit ? (
              <CustomerDialog customer={detail.customer} defs={customerDefs} />
            ) : null}
            {role === "admin" ? (
              <DeleteCustomerAction
                id={detail.customer.id}
                name={detail.customer.name}
              />
            ) : null}
          </div>
        </div>
      </section>

      <CustomerDetailView
        detail={detail}
        infra={infra}
        showInfra={showInfra}
        canEdit={canEdit}
        canDelete={role === "admin"}
        trackDefs={trackDefs}
        versionDefs={versionDefs}
        infraDefs={infraDefs}
        infraTypes={infraTypes}
      />
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
