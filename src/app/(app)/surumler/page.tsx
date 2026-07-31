import { Plus } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getFieldDefinitions } from "@/lib/fields/queries";
import { getVersionMatrix, getComponentLatest } from "@/lib/versions/queries";
import { buildVersionCatalog } from "@/lib/versions/catalog";
import { PageHeader } from "@/components/page-header";
import { VersionBoard } from "./version-board";
import { VersionEdit } from "./version-edit";
import { LatestPanel } from "./latest-panel";
import { Button } from "@/components/ui/button";
import { requirePage } from "@/lib/auth/access";

export default async function VersionsPage() {
  const access = await requirePage("surumler");
  const supabase = await createClient();

  const [rows, components, defs, customersResult] = await Promise.all([
    getVersionMatrix(),
    getComponentLatest(),
    getFieldDefinitions("version"),
    supabase.from("customers").select("id, name").order("name"),
  ]);
  const canEdit = access.canEdit;
  const isAdmin = access.isAdmin;
  const customers = customersResult.data ?? [];
  const firstCustomer = customers[0];
  const catalog = buildVersionCatalog(defs, components);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Sürüm Envanteri"
        subtitle={`${rows.length} kurulum, güncele göre renklendirilmiş`}
      >
        {canEdit && firstCustomer && (
          <VersionEdit
            customerId={firstCustomer.id}
            customerName={firstCustomer.name}
            record={null}
            defs={defs}
            trigger={
              <Button size="lg" className="press h-10 gap-2">
                <Plus className="size-4" />
                Yeni kayıt
              </Button>
            }
          />
        )}
      </PageHeader>
      {isAdmin && <LatestPanel components={catalog.components} />}
      <VersionBoard
        rows={rows}
        catalog={catalog}
        defs={defs}
        canEdit={canEdit}
        isAdmin={isAdmin}
      />
    </div>
  );
}
