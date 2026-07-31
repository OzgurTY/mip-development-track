"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Building2,
  CalendarDays,
  ChevronLeft,
  ExternalLink,
  Globe,
  MapPin,
  Pencil,
  Repeat,
  RotateCcw,
  Trash2,
  TriangleAlert,
  User,
} from "lucide-react";
import { toast } from "sonner";
import { EventDialog } from "../event-dialog";
import { EventPlanning } from "./event-planning";
import {
  deleteEvent,
  restoreOccurrence,
  setEventStatus,
  skipOccurrence,
} from "@/lib/events/actions";
import {
  addDays,
  daysBetween,
  daysUntil,
  formatDayTr,
  formatRangeTr,
  formatTime,
  todayIso,
} from "@/lib/calendar/date";
import {
  describeRecurrence,
  expandOccurrences,
} from "@/lib/calendar/recurrence";
import {
  EVENT_STATUSES,
  PARTICIPATION_LABEL,
  STATUS_LABEL,
  locationLabel,
  recurrenceOf,
  type EventItem,
  type EventType,
  type Participation,
} from "@/lib/events/types";
import { StatusBadge, tint } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { useConfirm } from "@/components/ui/confirm-dialog";

type Props = {
  event: EventItem;
  types: EventType[];
  customers: { id: string; name: string }[];
  owners: { id: string; name: string }[];
  canEdit: boolean;
  /** Tekrarlayan seride hangi tekrara bakildigi (?t=). */
  occurrenceStart?: string;
};

export function EventDetail({
  event,
  types,
  customers,
  owners,
  canEdit,
  occurrenceStart,
}: Props) {
  const router = useRouter();
  const confirm = useConfirm();
  const [editing, setEditing] = useState(false);
  const [pending, startTransition] = useTransition();
  const today = todayIso();

  const rec = recurrenceOf(event);
  const repeatText = describeRecurrence({ start: event.start_date }, rec);
  const duration =
    event.end_date && event.end_date > event.start_date
      ? daysBetween(event.start_date, event.end_date)
      : 0;
  // Bir tekrara bakiliyorsa tarihler o tekrarin tarihleri gosterilir.
  const shownStart = occurrenceStart ?? event.start_date;
  const shownEnd = duration > 0 ? addDays(shownStart, duration) : event.end_date;
  const nextOccurrences = rec.freq
    ? expandOccurrences({ start: event.start_date, end: event.end_date }, rec, {
        from: today,
        to: `${Number(today.slice(0, 4)) + 2}-12-31`,
      }).slice(0, 5)
    : [];

  const place = locationLabel(event);
  const time = formatTime(event.start_time);
  const endTime = formatTime(event.end_time);
  const deadlineLeft = event.deadline_date
    ? daysUntil(event.deadline_date, today)
    : null;

  function changeStatus(status: string) {
    if (status === event.status) return;
    startTransition(async () => {
      const result = await setEventStatus(event.id, status);
      if (result.error) {
        toast.error(result.error);
        return;
      }
      router.refresh();
    });
  }

  function handleSkip() {
    startTransition(async () => {
      const result = await skipOccurrence(event.id, shownStart);
      if (result.error) {
        toast.error(result.error);
        return;
      }
      toast.success("Bu tekrar seriden çıkarıldı");
      router.push(`/takvim/${event.id}`);
    });
  }

  function handleRestore(date: string) {
    startTransition(async () => {
      const result = await restoreOccurrence(event.id, date);
      if (result.error) {
        toast.error(result.error);
        return;
      }
      router.refresh();
    });
  }

  async function handleDelete() {
    const ok = await confirm({
      title: "Etkinliği sil",
      description: (
        <>
          <strong>{event.title}</strong> kaydı silinecek. Bu işlem geri alınamaz.
        </>
      ),
      confirmLabel: "Sil",
    });
    if (!ok) return;
    startTransition(async () => {
      const result = await deleteEvent(event.id);
      if (result.error) {
        toast.error(result.error);
        return;
      }
      toast.success("Etkinlik silindi");
      router.push("/takvim");
    });
  }

  return (
    <div className="space-y-5">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <Link
            href="/takvim"
            className="press inline-flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            <ChevronLeft className="size-4" />
            Takvim
          </Link>
          <h1 className="mt-1 font-display text-2xl font-bold tracking-tight sm:text-3xl">
            {event.title}
          </h1>
          <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-sm text-muted-foreground">
            <span
              className="inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium"
              style={tint(event.typeColor)}
            >
              <span
                className="size-1.5 rounded-full"
                style={{ background: event.typeColor }}
              />
              {event.typeLabel}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <CalendarDays className="size-3.5" />
              {formatRangeTr(shownStart, shownEnd)}
              {time ? ` · ${time}${endTime ? `-${endTime}` : ""}` : ""}
            </span>
            {repeatText ? (
              <span className="inline-flex items-center gap-1.5">
                <Repeat className="size-3.5" />
                {repeatText}
              </span>
            ) : null}
            {place ? (
              <span className="inline-flex items-center gap-1.5">
                {event.is_online ? (
                  <Globe className="size-3.5" />
                ) : (
                  <MapPin className="size-3.5" />
                )}
                {place}
              </span>
            ) : null}
            {event.website ? (
              <a
                href={event.website}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 underline-offset-4 hover:text-foreground hover:underline"
              >
                <ExternalLink className="size-3.5" />
                Web sitesi
              </a>
            ) : null}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {canEdit ? (
            <Select
              aria-label="Durum"
              value={event.status}
              disabled={pending}
              onChange={(e) => changeStatus(e.target.value)}
              className="h-10 w-44"
            >
              {EVENT_STATUSES.map((status) => (
                <option key={status} value={status}>
                  {STATUS_LABEL[status]}
                </option>
              ))}
            </Select>
          ) : (
            <StatusBadge status={STATUS_LABEL[event.status]} />
          )}
          {canEdit ? (
            <>
              <Button
                size="lg"
                className="press h-10 gap-2"
                onClick={() => setEditing(true)}
              >
                <Pencil className="size-4" />
                Düzenle
              </Button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={pending}
                aria-label="Etkinliği sil"
                className="press grid size-10 place-items-center rounded-lg text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive disabled:opacity-50"
              >
                <Trash2 className="size-4" />
              </button>
            </>
          ) : null}
        </div>
      </header>

      {deadlineLeft !== null && deadlineLeft >= 0 && deadlineLeft <= 30 ? (
        <p
          className="flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm"
          style={tint("var(--accent-amber)")}
        >
          <TriangleAlert className="size-4" />
          Son başvuru {formatDayTr(event.deadline_date)}, {deadlineLeft} gün kaldı.
        </p>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-2">
        <Card title="Özet">
          {event.summary ? (
            <div className="space-y-1.5 text-sm">
              {event.summary.split("\n").map((line, i) => (
                <p key={i}>{line}</p>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              Neden katıldığımız / hedefimiz henüz yazılmadı.
            </p>
          )}
        </Card>

        <Card title="Künye">
          <dl className="grid gap-x-4 gap-y-2 text-sm sm:grid-cols-[9rem_1fr]">
            <Row label="Durum">{STATUS_LABEL[event.status]}</Row>
            <Row label="Katılım şekli">
              {event.participation
                ? (PARTICIPATION_LABEL[event.participation as Participation] ??
                  event.participation)
                : "-"}
            </Row>
            <Row label="Son başvuru">{formatDayTr(event.deadline_date)}</Row>
            <Row label="Sorumlu">
              {event.ownerName ? (
                <span className="inline-flex items-center gap-1.5">
                  <User className="size-3.5 text-muted-foreground" />
                  {event.ownerName}
                </span>
              ) : (
                "-"
              )}
            </Row>
            <Row label="İlgili müşteri">
              {event.customerName && event.customer_id ? (
                <Link
                  href={`/musteriler/${event.customer_id}`}
                  className="inline-flex items-center gap-1.5 underline-offset-4 hover:text-primary hover:underline"
                >
                  <Building2 className="size-3.5 text-muted-foreground" />
                  {event.customerName}
                </Link>
              ) : (
                "-"
              )}
            </Row>
            <Row label="Mekan">{event.venue || "-"}</Row>
            <Row label="Saat dilimi">{event.timezone || "-"}</Row>
          </dl>
        </Card>

        {rec.freq ? (
          <Card title="Tekrar" className="lg:col-span-2">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="space-y-1.5 text-sm">
                <p className="inline-flex items-center gap-2 font-medium">
                  <Repeat className="size-3.5 text-muted-foreground" />
                  {repeatText}
                </p>
                <p className="text-muted-foreground">
                  Seri başlangıcı {formatDayTr(event.start_date)}. Düzenleme tüm
                  tekrarları etkiler.
                </p>
                {nextOccurrences.length > 0 ? (
                  <p className="text-muted-foreground">
                    Sıradaki:{" "}
                    {nextOccurrences
                      .map((occ) => formatDayTr(occ.start))
                      .join(" · ")}
                  </p>
                ) : (
                  <p className="text-muted-foreground">
                    Bu serinin gelecek tekrarı kalmadı.
                  </p>
                )}
              </div>
              {canEdit && occurrenceStart ? (
                <Button
                  variant="outline"
                  size="lg"
                  className="press h-10 gap-2"
                  disabled={pending}
                  onClick={handleSkip}
                >
                  <Trash2 className="size-4" />
                  Bu tekrarı çıkar
                </Button>
              ) : null}
            </div>

            {event.repeat_skip_dates.length > 0 ? (
              <div className="mt-4 border-t border-border/60 pt-3">
                <p className="mb-2 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                  Seriden çıkarılanlar
                </p>
                <ul className="flex flex-wrap gap-1.5">
                  {event.repeat_skip_dates.map((date) => (
                    <li
                      key={date}
                      className="inline-flex items-center gap-1.5 rounded-full bg-muted px-2.5 py-1 text-xs text-muted-foreground"
                    >
                      {formatDayTr(date)}
                      {canEdit ? (
                        <button
                          type="button"
                          onClick={() => handleRestore(date)}
                          disabled={pending}
                          aria-label={`${formatDayTr(date)} tekrarını geri al`}
                          className="press grid size-5 place-items-center rounded-full transition-colors hover:bg-accent hover:text-foreground disabled:opacity-40"
                        >
                          <RotateCcw className="size-3" />
                        </button>
                      ) : null}
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </Card>
        ) : null}

        {event.outcome ? (
          <Card title="Değerlendirme" className="lg:col-span-2">
            <div className="space-y-1.5 text-sm">
              {event.outcome.split("\n").map((line, i) => (
                <p key={i}>{line}</p>
              ))}
            </div>
          </Card>
        ) : null}
      </div>

      <EventPlanning event={event} canEdit={canEdit} />

      {canEdit ? (
        <EventDialog
          open={editing}
          onOpenChange={setEditing}
          event={event}
          types={types}
          customers={customers}
          owners={owners}
        />
      ) : null}
    </div>
  );
}

function Card({
  title,
  className,
  children,
}: {
  title: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <section className={`bento p-5 ${className ?? ""}`}>
      <h2 className="mb-3 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
        {title}
      </h2>
      {children}
    </section>
  );
}

function Row({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="contents">
      <dt className="text-muted-foreground">{label}</dt>
      <dd>{children}</dd>
    </div>
  );
}
