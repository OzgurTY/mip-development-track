import { notFound } from "next/navigation";
import { requirePage } from "@/lib/auth/access";
import { createClient } from "@/lib/supabase/server";
import { getEvent, getEventTypes, getOwnerOptions } from "@/lib/events/queries";
import { EventDetail } from "./event-detail";

export default async function EventDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ t?: string }>;
}) {
  const access = await requirePage("takvim");
  const [{ id }, { t }] = await Promise.all([params, searchParams]);

  const supabase = await createClient();
  const [event, types, owners, customersResult] = await Promise.all([
    getEvent(id),
    getEventTypes(),
    getOwnerOptions(),
    supabase.from("customers").select("id, name").order("name"),
  ]);
  if (!event) notFound();

  return (
    <EventDetail
      event={event}
      types={types}
      owners={owners}
      customers={customersResult.data ?? []}
      canEdit={access.canEdit}
      occurrenceStart={/^\d{4}-\d{2}-\d{2}$/.test(t ?? "") ? t : undefined}
    />
  );
}
