import { createClient } from "@/lib/supabase/server";
import { getFieldDefinitions } from "@/lib/fields/queries";
import { PageHeader } from "@/components/page-header";
import { CustomerDialog } from "./customer-dialog";
import { CustomerTable } from "./customer-table";
import { requirePage } from "@/lib/auth/access";

export default async function CustomersPage() {
  const access = await requirePage("musteriler");
  const supabase = await createClient();

  const [rowsResult, defs] = await Promise.all([
    supabase
      .from("customers")
      .select("id, name, is_active, custom_fields")
      .order("name"),
    getFieldDefinitions("customer"),
  ]);

  const rows = rowsResult.data ?? [];
  const canEdit = access.canEdit;
  const canDelete = access.isAdmin;

  return (
    <div className="space-y-6">
      <PageHeader title="Müşteriler" subtitle={`${rows.length} müşteri`}>
        <CustomerDialog defs={defs} />
      </PageHeader>
      <CustomerTable
        rows={rows}
        canEdit={canEdit}
        canDelete={canDelete}
        defs={defs}
      />
    </div>
  );
}
