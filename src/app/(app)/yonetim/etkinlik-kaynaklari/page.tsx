import { requirePage } from "@/lib/auth/access";
import { getCandidates, getEventSources } from "@/lib/events/sources";
import { PageHeader } from "@/components/page-header";
import { AdminSubnav } from "../admin-subnav";
import { EventSourceAdmin } from "./source-admin";

export default async function EventSourcesPage() {
  await requirePage("yonetim");

  const [sources, candidates] = await Promise.all([
    getEventSources(),
    getCandidates(),
  ]);

  const candidateCounts: Record<string, number> = {};
  for (const candidate of candidates) {
    candidateCounts[candidate.source_id] =
      (candidateCounts[candidate.source_id] ?? 0) + 1;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Yönetim"
        subtitle="Takvim için dış etkinlik kaynakları ve tarama durumu."
      />
      <AdminSubnav />
      <EventSourceAdmin sources={sources} candidateCounts={candidateCounts} />
    </div>
  );
}
