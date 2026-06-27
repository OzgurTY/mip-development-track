import Link from "next/link";
import { notFound } from "next/navigation";
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
      <div className="space-y-1">
        <Link
          href="/musteriler"
          className="text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          Müşteriler
        </Link>
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-semibold">{detail.customer.name}</h1>
          {!detail.customer.is_active ? (
            <span className="text-sm text-muted-foreground">Pasif</span>
          ) : null}
          <StatusBadge status={detail.record?.status ?? null} />
        </div>
      </div>
      <CustomerDetailView detail={detail} infra={infra} showInfra={showInfra} />
    </div>
  );
}
