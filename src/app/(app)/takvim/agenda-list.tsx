"use client";

import Link from "next/link";
import { CalendarDays, Globe, MapPin, Repeat } from "lucide-react";
import { groupByMonth } from "@/lib/calendar/agenda";
import { formatRangeTr, formatTime } from "@/lib/calendar/date";
import { StatusBadge, tint } from "@/components/status-badge";
import { EmptyState } from "@/components/empty-state";
import { eventHref, type CalendarEvent } from "@/lib/events/expand";
import { eventEnd, locationLabel, STATUS_LABEL } from "@/lib/events/types";

type Props = {
  events: CalendarEvent[];
  today: string;
};

/** Aya gore gruplanmis liste. Telefonda ay izgarasinin yerine bu gecer. */
export function AgendaList({ events, today }: Props) {
  const groups = groupByMonth(
    events.map((event) => ({ start: event.start_date, event })),
  );

  if (groups.length === 0) {
    return (
      <div className="bento">
        <EmptyState
          icon={CalendarDays}
          title="Etkinlik yok"
          description="Filtreyi değiştirin veya yeni bir etkinlik ekleyin."
        />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {groups.map((group) => (
        <section key={group.key} className="bento overflow-hidden">
          <h3 className="border-b border-border/60 bg-muted/40 px-4 py-2.5 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
            {group.label}
            <span className="ml-2 normal-case opacity-70">
              {group.items.length} etkinlik
            </span>
          </h3>
          <ul>
            {group.items.map(({ event }) => {
              const isPast = eventEnd(event) < today;
              const place = locationLabel(event);
              const time = formatTime(event.start_time);
              return (
                <li
                  key={event.occurrenceKey}
                  className="border-b border-border/50 last:border-b-0"
                >
                  <Link
                    href={eventHref(event)}
                    className={
                      isPast
                        ? "flex flex-wrap items-center gap-x-3 gap-y-1.5 px-4 py-3 opacity-60 transition-colors hover:bg-accent/60 hover:opacity-100"
                        : "flex flex-wrap items-center gap-x-3 gap-y-1.5 px-4 py-3 transition-colors hover:bg-accent/60"
                    }
                  >
                    <span className="w-full text-xs tabular-nums text-muted-foreground sm:w-40">
                      {formatRangeTr(event.start_date, event.end_date)}
                      {time ? ` · ${time}` : ""}
                    </span>
                    <span
                      className="inline-flex shrink-0 items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] font-medium"
                      style={tint(event.typeColor)}
                    >
                      <span
                        className="size-1.5 rounded-full"
                        style={{ background: event.typeColor }}
                      />
                      {event.typeLabel}
                    </span>
                    <span className="flex min-w-0 flex-1 items-center gap-1.5 truncate font-medium">
                      {event.hasRepeat ? (
                        <Repeat className="size-3 shrink-0 text-muted-foreground" />
                      ) : null}
                      <span className="truncate">{event.title}</span>
                    </span>
                    {place ? (
                      <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                        {event.is_online ? (
                          <Globe className="size-3.5" />
                        ) : (
                          <MapPin className="size-3.5" />
                        )}
                        {place}
                      </span>
                    ) : null}
                    <StatusBadge status={STATUS_LABEL[event.status]} />
                  </Link>
                </li>
              );
            })}
          </ul>
        </section>
      ))}
    </div>
  );
}
