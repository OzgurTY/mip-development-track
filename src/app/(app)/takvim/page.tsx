import { requirePage } from "@/lib/auth/access";
import { createClient } from "@/lib/supabase/server";
import { getEvents, getEventTypes, getOwnerOptions } from "@/lib/events/queries";
import { getCandidates } from "@/lib/events/sources";
import { CalendarView } from "./calendar-view";

export default async function CalendarPage({
  searchParams,
}: {
  searchParams: Promise<{ g?: string }>;
}) {
  const access = await requirePage("takvim");
  const supabase = await createClient();

  const [{ g }, events, types, owners, candidates, customersResult] =
    await Promise.all([
      searchParams,
      getEvents(),
      getEventTypes(),
      getOwnerOptions(),
      getCandidates(),
      supabase.from("customers").select("id, name").order("name"),
    ]);

  return (
    <CalendarView
      events={events}
      types={types}
      owners={owners}
      customers={customersResult.data ?? []}
      canEdit={access.canEdit}
      candidates={candidates}
      initialView={g === "ajanda" ? "ajanda" : g === "radar" ? "radar" : "ay"}
    />
  );
}
