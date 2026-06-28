import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getFieldDefinitions } from "@/lib/fields/queries";
import { getInfraTypes } from "@/lib/infra/type-queries";
import { PageHeader } from "@/components/page-header";
import {
  FieldAdminTabs,
  type FlatGroup,
  type InfraGroup,
} from "./field-admin-tabs";
import type { FieldDefinition } from "@/lib/fields/types";

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

  const [customer, track, version, infraDefs, infraTypes] = await Promise.all([
    getFieldDefinitions("customer"),
    getFieldDefinitions("track"),
    getFieldDefinitions("version"),
    getFieldDefinitions("infra"),
    getInfraTypes(),
  ]);

  const flat: FlatGroup[] = [
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
  ];

  const fieldsByType: Record<string, FieldDefinition[]> = {};
  for (const t of infraTypes) {
    fieldsByType[t.key] = infraDefs.filter((d) => d.group === t.key);
  }

  const infra: InfraGroup = {
    label: "Altyapı",
    description: "Altyapı tipleri ve her tipin alanları.",
    types: infraTypes,
    fieldsByType,
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Yönetim"
        subtitle="Her modülün alan yapısını buradan yönet."
      />
      <FieldAdminTabs flat={flat} infra={infra} />
    </div>
  );
}
