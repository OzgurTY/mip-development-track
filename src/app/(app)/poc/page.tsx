import { createClient } from "@/lib/supabase/server";
import { getPocList } from "@/lib/poc/queries";
import { PageHeader } from "@/components/page-header";
import { PocBoard } from "./poc-board";
import { PocCreate } from "./poc-create";
import { requirePage } from "@/lib/auth/access";

export default async function PocPage() {
  const access = await requirePage("poc");
  const supabase = await createClient();

  const [rows, customersResult] = await Promise.all([
    getPocList(),
    supabase.from("customers").select("id, name").order("name"),
  ]);

  const canEdit = access.canEdit;
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
