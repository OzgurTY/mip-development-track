import { createClient } from "@/lib/supabase/server";
import { getPocList } from "@/lib/poc/queries";
import { PageHeader } from "@/components/page-header";
import { PocBoard } from "./poc-board";
import { PocCreate } from "./poc-create";

export default async function PocPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [rows, customersResult, profileResult] = await Promise.all([
    getPocList(),
    supabase.from("customers").select("id, name").order("name"),
    supabase.from("profiles").select("role").eq("id", user!.id).single(),
  ]);

  const role = profileResult.data?.role ?? "viewer";
  const canEdit = role === "admin" || role === "editor";
  const customers = customersResult.data ?? [];
  const done = rows.filter((r) => r.status === "Tamamlandı").length;

  return (
    <div className="space-y-6">
      <PageHeader
        title="PoC"
        subtitle={`${rows.length} kavram kanıtı, ${done} tanesi tamamlandı`}
      >
        {canEdit && <PocCreate customers={customers} />}
      </PageHeader>
      <PocBoard rows={rows} canEdit={canEdit} />
    </div>
  );
}
