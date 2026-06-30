import { createClient } from "@/lib/supabase/server";
import { getFieldDefinitions } from "@/lib/fields/queries";
import { PageHeader } from "@/components/page-header";
import { CustomerDialog } from "./customer-dialog";
import { CustomerTable } from "./customer-table";

export default async function CustomersPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [rowsResult, profileResult, defs] = await Promise.all([
    supabase
      .from("customers")
      .select("id, name, is_active, custom_fields")
      .order("name"),
    supabase.from("profiles").select("role").eq("id", user!.id).single(),
    getFieldDefinitions("customer"),
  ]);

  const rows = rowsResult.data ?? [];
  const role = profileResult.data?.role ?? "viewer";
  const canEdit = role === "admin" || role === "editor";
  const canDelete = role === "admin";

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
