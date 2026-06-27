import { Plus } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getFieldDefinitions } from "@/lib/fields/queries";
import { getVersionMatrix, getComponentLatest } from "@/lib/versions/queries";
import { PageHeader } from "@/components/page-header";
import { VersionMatrix } from "./version-matrix";
import { VersionEdit } from "./version-edit";
import { LatestPanel } from "./latest-panel";
import { Button } from "@/components/ui/button";

export default async function VersionsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [rows, components, defs, customersResult, profileResult] =
    await Promise.all([
      getVersionMatrix(),
      getComponentLatest(),
      getFieldDefinitions("version"),
      supabase.from("customers").select("id, name").order("name"),
      supabase.from("profiles").select("role").eq("id", user!.id).single(),
    ]);
  const role = profileResult.data?.role ?? "viewer";
  const canEdit = ["editor", "admin"].includes(role);
  const isAdmin = role === "admin";
  const customers = customersResult.data ?? [];
  const firstCustomer = customers[0];

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
      {isAdmin && <LatestPanel components={components} />}
      <VersionMatrix
        rows={rows}
        components={components}
        defs={defs}
        canEdit={canEdit}
      />
    </div>
  );
}
