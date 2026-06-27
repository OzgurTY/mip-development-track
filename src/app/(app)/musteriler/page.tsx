import { createClient } from "@/lib/supabase/server";
import { getFieldDefinitions } from "@/lib/fields/queries";
import { PageHeader } from "@/components/page-header";
import { CustomerForm } from "./customer-form";
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
  const canDelete = profileResult.data?.role === "admin";

  return (
    <div className="space-y-6">
      <PageHeader title="Müşteriler" subtitle={`${rows.length} müşteri`}>
        <CustomerForm defs={defs} />
      </PageHeader>
      <CustomerTable rows={rows} canDelete={canDelete} defs={defs} />
    </div>
  );
}
