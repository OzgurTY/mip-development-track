import { requirePage } from "@/lib/auth/access";
import { getEvents, getEventTypes } from "@/lib/events/queries";
import { PageHeader } from "@/components/page-header";
import { AdminSubnav } from "../admin-subnav";
import { EventTypeAdmin } from "./type-admin";

export default async function EventTypesPage() {
  await requirePage("yonetim");

  const [types, events] = await Promise.all([getEventTypes(), getEvents()]);

  // Silme onayinda "bu tipte N etkinlik var" diyebilmek icin kullanim sayisi.
  const usage: Record<string, number> = {};
  for (const event of events) {
    if (!event.type) continue;
    usage[event.type] = (usage[event.type] ?? 0) + 1;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Yönetim"
        subtitle="Takvimde kullanılan etkinlik tipleri ve renkleri."
      />
      <AdminSubnav />
      <EventTypeAdmin types={types} usage={usage} />
    </div>
  );
}
