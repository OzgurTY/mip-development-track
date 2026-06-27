import { createClient } from "@/lib/supabase/server";
import { getFieldDefinitions } from "@/lib/fields/queries";
import { getVersionMatrix, getComponentLatest } from "@/lib/versions/queries";
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Sürüm Envanteri</h1>
          <p className="text-sm text-muted-foreground">
            {rows.length} kurulum, güncele göre renklendirilmiş
          </p>
        </div>
        {canEdit && firstCustomer && (
          <VersionEdit
            customerId={firstCustomer.id}
            customerName={firstCustomer.name}
            record={null}
            defs={defs}
            trigger={<Button>Yeni kayıt</Button>}
          />
        )}
      </div>
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
