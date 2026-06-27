import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getFieldDefinitions } from "@/lib/fields/queries";
import { PageHeader } from "@/components/page-header";
import { FieldForm } from "./field-form";
import { FieldList } from "./field-list";

export default async function FieldAdminPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user!.id)
    .single();
  if (profile?.role !== "admin") redirect("/");

  const defs = await getFieldDefinitions("customer");

  return (
    <div className="space-y-6">
      <PageHeader
        title="Müşteri Alanları"
        subtitle="Müşteri kayıtlarına eklenecek özel alanlar"
      >
        <FieldForm entity="customer" />
      </PageHeader>
      <FieldList defs={defs} />
    </div>
  );
}
