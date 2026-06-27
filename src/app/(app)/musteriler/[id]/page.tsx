import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getCustomerDetail } from "@/lib/customers/detail";
import { getInfraEntries } from "@/lib/infra/queries";
import { CustomerDetailView } from "./customer-detail";
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
  const showInfra = role === "admin" || role === "editor";
  const infra: InfraEntry[] = showInfra ? await getInfraEntries(id) : [];

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Link
          href="/musteriler"
          className="press inline-flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ChevronLeft className="size-4" />
          Müşteriler
        </Link>
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="font-display text-3xl font-bold tracking-tight">
            {detail.customer.name}
          </h1>
          <StatusBadge status={detail.record?.status ?? null} />
          {!detail.customer.is_active ? (
            <span className="rounded-full bg-muted px-2.5 py-0.5 text-xs text-muted-foreground">
              Pasif
            </span>
          ) : null}
        </div>
      </div>
      <CustomerDetailView detail={detail} infra={infra} showInfra={showInfra} />
    </div>
  );
}
