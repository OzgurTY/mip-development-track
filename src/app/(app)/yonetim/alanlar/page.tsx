import { getFieldDefinitions } from "@/lib/fields/queries";
import { getInfraTypes } from "@/lib/infra/type-queries";
import { PageHeader } from "@/components/page-header";
import { AdminSubnav } from "../admin-subnav";
import {
  FieldAdminTabs,
  type FlatGroup,
  type InfraGroup,
} from "./field-admin-tabs";
import type { FieldDefinition } from "@/lib/fields/types";
import { requirePage } from "@/lib/auth/access";

export default async function FieldAdminPage() {
  await requirePage("yonetim");

  const [customer, track, version, event, infraDefs, infraTypes] =
    await Promise.all([
      getFieldDefinitions("customer"),
      getFieldDefinitions("track"),
      getFieldDefinitions("version"),
      getFieldDefinitions("event"),
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
    {
      entity: "event",
      label: "Etkinlikler",
      description: "Takvim etkinliklerine eklenen özel alanlar.",
      defs: event,
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
      <AdminSubnav />
      <FieldAdminTabs flat={flat} infra={infra} />
    </div>
  );
}
