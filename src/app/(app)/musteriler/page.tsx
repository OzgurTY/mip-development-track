import { createClient } from "@/lib/supabase/server";
import { CustomerForm } from "./customer-form";
import { CustomerTable } from "./customer-table";

export default async function CustomersPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [rowsResult, profileResult] = await Promise.all([
    supabase.from("customers").select("id, name, is_active").order("name"),
    supabase.from("profiles").select("role").eq("id", user!.id).single(),
  ]);

  const rows = rowsResult.data ?? [];
  const canDelete = profileResult.data?.role === "admin";

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Müşteriler</h1>
          <p className="text-sm text-muted-foreground">{rows.length} müşteri</p>
        </div>
        <CustomerForm />
      </div>
      <CustomerTable rows={rows} canDelete={canDelete} />
    </div>
  );
}
