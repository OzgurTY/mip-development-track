import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getFieldDefinitions } from "@/lib/fields/queries";
import { PageHeader } from "@/components/page-header";
import { FieldAdminTabs, type FieldGroup } from "./field-admin-tabs";

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

  const [customer, track, version, infra] = await Promise.all([
    getFieldDefinitions("customer"),
    getFieldDefinitions("track"),
    getFieldDefinitions("version"),
    getFieldDefinitions("infra"),
  ]);

  const groups: FieldGroup[] = [
    {
      entity: "customer",
      label: "Müşteriler",
      description: "Müşteri kayıtlarına eklenen özel alanlar.",
      defs: customer,
    },
    {
      entity: "track",
      label: "Takip",
      description: "Geliştirme takibi kayıtlarına eklenen alanlar.",
      defs: track,
    },
    {
      entity: "version",
      label: "Sürümler",
      description:
        "Sürüm kayıtlarındaki bileşenler ve ek özellikler (var/yok).",
      defs: version,
    },
    {
      entity: "infra",
      label: "Altyapı",
      description: "Altyapı kayıtlarındaki alanlar (hassas alanlar şifreli).",
      defs: infra,
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Yönetim"
        subtitle="Her modülün alan yapısını buradan yönet."
      />
      <FieldAdminTabs groups={groups} />
    </div>
  );
}
