import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getFieldDefinitions } from "@/lib/fields/queries";
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Müşteri Alanları</h1>
          <p className="text-sm text-muted-foreground">
            Müşteri kayıtlarına eklenecek özel alanlar
          </p>
        </div>
        <FieldForm entity="customer" />
      </div>
      <FieldList defs={defs} />
    </div>
  );
}
