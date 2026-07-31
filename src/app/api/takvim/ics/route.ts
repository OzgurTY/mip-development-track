import { getAccess } from "@/lib/auth/access";
import { canSeePage } from "@/lib/auth/pages";
import { buildIcs, type IcsEvent } from "@/lib/calendar/ics";
import { getEvents } from "@/lib/events/queries";
import { locationLabel, recurrenceOf, STATUS_LABEL } from "@/lib/events/types";

export const runtime = "nodejs";

/**
 * Takvimin iCalendar ciktisi. Outlook/Google'a "takvim aboneligi" olarak
 * eklenebilir; tekrarlayan seriler RRULE olarak gider, genisletilmez.
 */
export async function GET(request: Request) {
  const access = await getAccess();
  if (!canSeePage(access, "takvim")) {
    return new Response("Bu sayfaya erişiminiz yok", { status: 403 });
  }

  const url = new URL(request.url);
  const onlyConfirmed = url.searchParams.get("kapsam") === "onaylanan";

  const events = await getEvents();
  const stamp = `${new Date().toISOString().replace(/[-:]/g, "").slice(0, 15)}Z`;

  const items: IcsEvent[] = events
    .filter((event) => event.status !== "iptal")
    .filter((event) => !onlyConfirmed || event.status === "onaylandi")
    .map((event) => ({
      uid: `${event.id}@mip-development-track`,
      title: event.title,
      start: event.start_date,
      end: event.end_date,
      startTime: event.start_time,
      endTime: event.end_time,
      location: locationLabel(event),
      description: [
        event.typeLabel,
        STATUS_LABEL[event.status],
        event.summary ?? "",
      ]
        .filter(Boolean)
        .join(" · "),
      url: event.website,
      recurrence: recurrenceOf(event),
      stamp,
    }));

  const body = buildIcs(items, "MDP Etkinlik Takvimi");

  return new Response(body, {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": 'attachment; filename="mdp-takvim.ics"',
      "Cache-Control": "no-store",
    },
  });
}
