"use client";

import { useState } from "react";
import { Repeat } from "lucide-react";
import { mondayIndex } from "@/lib/calendar/date";
import {
  REPEAT_FREQS,
  REPEAT_FREQ_LABEL,
  WEEKDAY_FULL_TR,
  WEEKDAY_POSSESSIVE_TR,
  WEEKDAY_SHORT_TR,
  describeRecurrence,
  weekOfMonth,
  type MonthlyMode,
  type RepeatFreq,
} from "@/lib/calendar/recurrence";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { tint } from "@/components/status-badge";
import type { EventItem } from "@/lib/events/types";

type EndMode = "yok" | "tarih" | "sayi";

const INTERVAL_UNIT: Record<RepeatFreq, string> = {
  gunluk: "günde bir",
  haftalik: "haftada bir",
  aylik: "ayda bir",
  yillik: "yılda bir",
};

type Props = {
  event?: EventItem | null;
  /** Etiketler ("ayın 1. Çarşambası") baslangic tarihinden turetilir. */
  startDate: string;
};

export function RepeatFields({ event, startDate }: Props) {
  const [freq, setFreq] = useState<RepeatFreq | "">(event?.repeat_freq ?? "");
  const [interval, setInterval] = useState(String(event?.repeat_interval ?? 1));
  const [weekdays, setWeekdays] = useState<number[]>(
    event?.repeat_weekdays ?? [],
  );
  const [monthlyMode, setMonthlyMode] = useState<MonthlyMode>(
    event?.repeat_monthly_mode ?? "gun",
  );
  const [endMode, setEndMode] = useState<EndMode>(
    event?.repeat_until ? "tarih" : event?.repeat_count ? "sayi" : "yok",
  );
  const [until, setUntil] = useState(event?.repeat_until ?? "");
  const [count, setCount] = useState(
    event?.repeat_count ? String(event.repeat_count) : "",
  );

  const valid = /^\d{4}-\d{2}-\d{2}$/.test(startDate);
  const startWeekday = valid ? mondayIndex(startDate) : 0;
  const dayOfMonth = valid ? Number(startDate.slice(8, 10)) : 1;
  const nth = valid ? weekOfMonth(startDate) : 1;
  const effectiveWeekdays = weekdays.length > 0 ? weekdays : [startWeekday];

  const description = valid
    ? describeRecurrence(
        { start: startDate },
        {
          freq: freq === "" ? null : freq,
          interval: Number(interval) || 1,
          weekdays: effectiveWeekdays,
          monthlyMode,
          until: endMode === "tarih" ? until || null : null,
          count: endMode === "sayi" && count ? Number(count) : null,
          skipDates: [],
        },
      )
    : null;

  return (
    <div className="space-y-3">
      <input type="hidden" name="repeat_monthly_mode" value={monthlyMode} />
      <input type="hidden" name="repeat_end_mode" value={endMode} />
      {freq === "haftalik"
        ? effectiveWeekdays.map((day) => (
            <input
              key={day}
              type="hidden"
              name="repeat_weekdays"
              value={day}
            />
          ))
        : null}

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="repeat_freq">Tekrar</Label>
          <Select
            id="repeat_freq"
            name="repeat_freq"
            value={freq}
            onChange={(e) => setFreq(e.target.value as RepeatFreq | "")}
          >
            <option value="">Tekrar yok</option>
            {REPEAT_FREQS.map((value) => (
              <option key={value} value={value}>
                {REPEAT_FREQ_LABEL[value]}
              </option>
            ))}
          </Select>
        </div>
        {freq ? (
          <div className="space-y-1.5">
            <Label htmlFor="repeat_interval">Sıklık</Label>
            <div className="flex items-center gap-2">
              <Input
                id="repeat_interval"
                name="repeat_interval"
                type="number"
                min={1}
                max={52}
                value={interval}
                onChange={(e) => setInterval(e.target.value)}
                className="h-10 w-20 rounded-xl px-3"
              />
              <span className="text-sm text-muted-foreground">
                {INTERVAL_UNIT[freq]}
              </span>
            </div>
          </div>
        ) : null}
      </div>

      {freq === "haftalik" ? (
        <div className="space-y-1.5">
          <Label>Günler</Label>
          <div className="flex flex-wrap gap-1.5">
            {WEEKDAY_SHORT_TR.map((label, day) => {
              const active = effectiveWeekdays.includes(day);
              return (
                <button
                  key={label}
                  type="button"
                  aria-pressed={active}
                  aria-label={WEEKDAY_FULL_TR[day]}
                  onClick={() =>
                    setWeekdays(
                      active
                        ? effectiveWeekdays.filter((d) => d !== day)
                        : [...effectiveWeekdays, day],
                    )
                  }
                  className={
                    active
                      ? "press size-9 rounded-xl bg-primary text-sm font-medium text-primary-foreground"
                      : "press size-9 rounded-xl bg-card text-sm text-muted-foreground ring-1 ring-foreground/[0.08] transition-colors hover:text-foreground"
                  }
                >
                  {label}
                </button>
              );
            })}
          </div>
          {effectiveWeekdays.length === 0 ? (
            <p className="text-xs text-[var(--accent-amber)]">
              En az bir gün seçilmeli.
            </p>
          ) : null}
        </div>
      ) : null}

      {freq === "aylik" ? (
        <div className="space-y-1.5">
          <Label>Aylık kip</Label>
          <div className="flex flex-wrap gap-1.5">
            <ModeButton
              active={monthlyMode === "gun"}
              onClick={() => setMonthlyMode("gun")}
            >
              Ayın {dayOfMonth}. günü
            </ModeButton>
            <ModeButton
              active={monthlyMode === "hafta_gunu"}
              onClick={() => setMonthlyMode("hafta_gunu")}
            >
              Ayın {nth >= 5 ? "son" : `${nth}.`}{" "}
              {WEEKDAY_POSSESSIVE_TR[startWeekday]}
            </ModeButton>
          </div>
          {monthlyMode === "gun" && dayOfMonth > 28 ? (
            <p className="text-xs text-muted-foreground">
              Bu günün olmadığı aylar atlanır.
            </p>
          ) : null}
        </div>
      ) : null}

      {freq ? (
        <div className="space-y-1.5">
          <Label>Bitiş</Label>
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex flex-wrap gap-1.5">
              <ModeButton
                active={endMode === "yok"}
                onClick={() => setEndMode("yok")}
              >
                Süresiz
              </ModeButton>
              <ModeButton
                active={endMode === "tarih"}
                onClick={() => setEndMode("tarih")}
              >
                Tarihe kadar
              </ModeButton>
              <ModeButton
                active={endMode === "sayi"}
                onClick={() => setEndMode("sayi")}
              >
                Tekrar sayısı
              </ModeButton>
            </div>
            {endMode === "tarih" ? (
              <Input
                name="repeat_until"
                type="date"
                value={until}
                onChange={(e) => setUntil(e.target.value)}
                className="h-10 w-44 rounded-xl px-3"
              />
            ) : null}
            {endMode === "sayi" ? (
              <Input
                name="repeat_count"
                type="number"
                min={1}
                max={400}
                value={count}
                onChange={(e) => setCount(e.target.value)}
                placeholder="Örn. 12"
                className="h-10 w-28 rounded-xl px-3"
              />
            ) : null}
          </div>
          {endMode === "yok" ? (
            <p className="text-xs text-muted-foreground">
              Süresiz seriler takvimde en fazla 400 tekrar gösterilir.
            </p>
          ) : null}
        </div>
      ) : null}

      {description ? (
        <p
          className="inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm"
          style={tint("var(--accent-indigo)")}
        >
          <Repeat className="size-3.5" />
          {description}
        </p>
      ) : null}
    </div>
  );
}

function ModeButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={
        active
          ? "press rounded-xl bg-primary px-3 py-2 text-sm font-medium text-primary-foreground"
          : "press rounded-xl bg-card px-3 py-2 text-sm text-muted-foreground ring-1 ring-foreground/[0.08] transition-colors hover:text-foreground"
      }
    >
      {children}
    </button>
  );
}
