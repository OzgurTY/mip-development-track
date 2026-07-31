"use client";

import Link from "next/link";
import { Repeat } from "lucide-react";
import { WEEKDAYS_TR } from "@/lib/calendar/date";
import { buildMonthGrid, layoutWeekBands } from "@/lib/calendar/grid";
import { eventHref, type CalendarEvent } from "@/lib/events/expand";
import { eventEnd } from "@/lib/events/types";

/** Bir haftada gosterilen en fazla serit; fazlasi "+N" olarak toplanir. */
const MAX_LANES = 4;

type Props = {
  year: number;
  monthIndex: number;
  today: string;
  events: CalendarEvent[];
  /** Bos gune tiklayinca o tarihle yeni etkinlik acar. */
  onDayClick?: (iso: string) => void;
};

export function MonthGrid({
  year,
  monthIndex,
  today,
  events,
  onDayClick,
}: Props) {
  const weeks = buildMonthGrid(year, monthIndex, today);
  const bandInputs = events.map((event) => ({
    id: event.occurrenceKey,
    start: event.start_date,
    end: eventEnd(event),
    event,
  }));

  return (
    <div className="bento overflow-hidden">
      <div className="grid grid-cols-7 border-b border-border/60 bg-muted/40">
        {WEEKDAYS_TR.map((day) => (
          <div
            key={day}
            className="px-2 py-2 text-center text-[11px] font-semibold tracking-wide text-muted-foreground uppercase"
          >
            {day}
          </div>
        ))}
      </div>

      {weeks.map((week) => {
        const bands = layoutWeekBands(bandInputs, week.startIso);
        const visible = bands.filter((band) => band.lane < MAX_LANES);
        const hidden = bands.length - visible.length;
        const laneCount = Math.max(
          1,
          ...visible.map((band) => band.lane + 1),
        );

        return (
          <div
            key={week.startIso}
            className="grid grid-cols-7 border-b border-border/60 last:border-b-0"
            style={{
              gridTemplateRows: `1.5rem repeat(${laneCount}, 1.35rem) auto`,
            }}
          >
            {week.days.map((day, index) => (
              <DayCell
                key={`bg-${day.iso}`}
                column={index + 1}
                iso={day.iso}
                inMonth={day.inMonth}
                isToday={day.isToday}
                onClick={onDayClick}
              />
            ))}

            {week.days.map((day, index) => (
              <span
                key={`num-${day.iso}`}
                style={{ gridColumn: index + 1, gridRow: 1 }}
                className={
                  day.isToday
                    ? "pointer-events-none z-10 px-2 pt-1 text-xs font-bold text-primary"
                    : day.inMonth
                      ? "pointer-events-none z-10 px-2 pt-1 text-xs font-medium"
                      : "pointer-events-none z-10 px-2 pt-1 text-xs text-muted-foreground/50"
                }
              >
                {day.day}
              </span>
            ))}

            {visible.map((band) => (
              <Link
                key={band.item.id}
                href={eventHref(band.item.event)}
                title={band.item.event.title}
                style={{
                  gridColumn: `${band.startCol + 1} / span ${band.span}`,
                  gridRow: band.lane + 2,
                  background: `color-mix(in oklch, ${band.item.event.typeColor} 18%, transparent)`,
                  boxShadow: `inset 0 0 0 1px color-mix(in oklch, ${band.item.event.typeColor} 34%, transparent)`,
                  borderTopLeftRadius: band.continuesLeft ? 0 : undefined,
                  borderBottomLeftRadius: band.continuesLeft ? 0 : undefined,
                  borderTopRightRadius: band.continuesRight ? 0 : undefined,
                  borderBottomRightRadius: band.continuesRight ? 0 : undefined,
                }}
                className="z-10 mx-1 flex items-center gap-1 truncate rounded-md px-1.5 text-[11px] font-medium transition-opacity hover:opacity-80"
              >
                <span
                  className="size-1.5 shrink-0 rounded-full"
                  style={{ background: band.item.event.typeColor }}
                />
                {band.item.event.hasRepeat ? (
                  <Repeat className="size-2.5 shrink-0 opacity-60" />
                ) : null}
                <span className="truncate">{band.item.event.title}</span>
              </Link>
            ))}

            {hidden > 0 ? (
              <span
                style={{ gridColumn: "1 / -1", gridRow: laneCount + 2 }}
                className="z-10 px-2 pb-1 text-[11px] text-muted-foreground"
              >
                +{hidden} etkinlik daha
              </span>
            ) : (
              <span
                style={{ gridColumn: "1 / -1", gridRow: laneCount + 2 }}
                className="pb-1"
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

function DayCell({
  column,
  iso,
  inMonth,
  isToday,
  onClick,
}: {
  column: number;
  iso: string;
  inMonth: boolean;
  isToday: boolean;
  onClick?: (iso: string) => void;
}) {
  const surface = isToday
    ? "bg-primary/[0.07]"
    : inMonth
      ? ""
      : "bg-muted/30";
  const style = { gridColumn: column, gridRow: "1 / -1" };
  const border = column < 7 ? "border-r border-border/60" : "";

  if (!onClick) {
    return <span style={style} className={`${surface} ${border}`} />;
  }
  return (
    <button
      type="button"
      onClick={() => onClick(iso)}
      aria-label={`${iso} için etkinlik ekle`}
      style={style}
      className={`${surface} ${border} min-h-[5rem] transition-colors hover:bg-accent/60`}
    />
  );
}
