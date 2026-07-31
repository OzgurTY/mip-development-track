"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ExternalLink, Save, Wallet, Users, ListChecks, Plane } from "lucide-react";
import { toast } from "sonner";
import { RowEditor } from "@/components/row-editor";
import { saveEventPlanning } from "@/lib/events/actions";
import {
  ATTENDEE_ROLES,
  COST_KINDS,
  COST_STATUSES,
  CURRENCIES,
  EMPTY_ATTENDEE,
  EMPTY_COST,
  EMPTY_TASK,
  EMPTY_TRAVEL,
  TASK_STATUSES,
  TRAVEL_KINDS,
  TRAVEL_STATUSES,
  formatAmount,
  openTaskCount,
  totalByCurrency,
  type PlanningDraft,
} from "@/lib/events/planning";
import { Button } from "@/components/ui/button";
import type { EventItem } from "@/lib/events/types";

type Props = {
  event: EventItem;
  canEdit: boolean;
};

/**
 * Planlama blogu: gorevler, maliyet, ekip ve seyahat tek formda tutulur ve
 * tek kaydetme ile yazilir. Satir duzenleyici PoC modulundekinin aynisi.
 */
export function EventPlanning({ event, canEdit }: Props) {
  const router = useRouter();
  const initial = useMemo<PlanningDraft>(
    () => ({
      tasks: event.tasks,
      costs: event.costs,
      attendees: event.attendees,
      travel: event.travel,
    }),
    [event],
  );
  const [draft, setDraft] = useState<PlanningDraft>(initial);
  const [saved, setSaved] = useState(() => JSON.stringify(initial));
  const [pending, startTransition] = useTransition();

  const isDirty = JSON.stringify(draft) !== saved;
  const totals = totalByCurrency(draft.costs);
  const open = openTaskCount(draft.tasks);
  const chosenTravel = draft.travel.filter((row) => row.status === "Seçildi");

  function patch(values: Partial<PlanningDraft>) {
    setDraft((current) => ({ ...current, ...values }));
  }

  function save() {
    const snapshot = JSON.stringify(draft);
    startTransition(async () => {
      const result = await saveEventPlanning(event.id, draft);
      if (result.error) {
        toast.error(result.error);
        return;
      }
      setSaved(snapshot);
      toast.success("Planlama kaydedildi");
      router.refresh();
    });
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="font-display text-lg font-semibold">Planlama</h2>
        {canEdit ? (
          <div className="flex items-center gap-2">
            {isDirty ? (
              <span className="inline-flex items-center gap-1.5 text-sm text-muted-foreground">
                <span className="size-1.5 rounded-full bg-[var(--accent-amber)]" />
                Kaydedilmedi
              </span>
            ) : null}
            <Button
              size="lg"
              className="press h-10 gap-2"
              onClick={save}
              disabled={pending || !isDirty}
            >
              <Save className="size-4" />
              {pending ? "Kaydediliyor..." : "Planlamayı kaydet"}
            </Button>
          </div>
        ) : null}
      </div>

      <Block
        icon={ListChecks}
        title="Görevler"
        summary={
          draft.tasks.length > 0
            ? `${draft.tasks.length - open}/${draft.tasks.length} tamamlandı`
            : undefined
        }
      >
        <RowEditor
          columns={[
            { key: "title", label: "Görev", width: "3fr" },
            { key: "due_date", label: "Son tarih", width: "1.1fr", kind: "date" },
            {
              key: "status",
              label: "Durum",
              width: "1.2fr",
              kind: "select",
              options: TASK_STATUSES,
            },
            { key: "assignee", label: "Sorumlu", width: "1.2fr" },
          ]}
          rows={draft.tasks}
          empty={EMPTY_TASK}
          onChange={(tasks) => patch({ tasks })}
          addLabel="Görev ekle"
          emptyHint="Sponsorluk paketi, bilet, sunum hazırlığı gibi adımları ekleyin."
          disabled={!canEdit}
        />
      </Block>

      <Block
        icon={Wallet}
        title="Maliyet"
        summary={
          totals.length > 0
            ? totals
                .map((total) => formatAmount(total.total, total.currency))
                .join(" · ")
            : undefined
        }
      >
        <RowEditor
          columns={[
            {
              key: "kind",
              label: "Kalem",
              width: "1.2fr",
              kind: "select",
              options: COST_KINDS,
            },
            { key: "label", label: "Açıklama", width: "2.4fr" },
            { key: "amount", label: "Tutar", width: "1fr", kind: "number" },
            {
              key: "currency",
              label: "Para birimi",
              width: "1fr",
              kind: "select",
              options: CURRENCIES,
            },
            {
              key: "status",
              label: "Durum",
              width: "1.2fr",
              kind: "select",
              options: COST_STATUSES,
            },
          ]}
          rows={draft.costs}
          empty={EMPTY_COST}
          onChange={(costs) => patch({ costs })}
          addLabel="Maliyet kalemi ekle"
          emptyHint="Sponsorluk, bilet, uçuş ve konaklama kalemlerini ayrı ayrı girin."
          disabled={!canEdit}
        />
        {totals.length > 1 ? (
          <p className="mt-2 text-xs text-muted-foreground">
            Farklı para birimleri ayrı toplanır, kur çevrimi yapılmaz.
          </p>
        ) : null}
      </Block>

      <Block
        icon={Users}
        title="Ekip"
        summary={
          draft.attendees.length > 0
            ? `${draft.attendees.length} kişi`
            : undefined
        }
      >
        <RowEditor
          columns={[
            { key: "name", label: "Ad Soyad", width: "2fr" },
            {
              key: "role",
              label: "Rol",
              width: "1.2fr",
              kind: "select",
              options: ATTENDEE_ROLES,
            },
            { key: "note", label: "Not", width: "2fr" },
          ]}
          rows={draft.attendees}
          empty={EMPTY_ATTENDEE}
          onChange={(attendees) => patch({ attendees })}
          addLabel="Kişi ekle"
          emptyHint="Etkinliğe kimlerin gideceğini ekleyin."
          disabled={!canEdit}
        />
      </Block>

      <Block
        icon={Plane}
        title="Seyahat ve konaklama"
        summary={
          chosenTravel.length > 0
            ? `Seçilen: ${chosenTravel.map((row) => row.name || row.kind).join(", ")}`
            : undefined
        }
      >
        <div className="overflow-x-auto">
          <div className="sm:min-w-[54rem]">
            <RowEditor
              columns={[
                {
                  key: "kind",
                  label: "Tür",
                  width: "1fr",
                  kind: "select",
                  options: TRAVEL_KINDS,
                },
                { key: "name", label: "Ad / otel", width: "2fr" },
                { key: "person", label: "Kişi", width: "1.2fr" },
                { key: "check_in", label: "Giriş", width: "1.1fr", kind: "date" },
                { key: "check_out", label: "Çıkış", width: "1.1fr", kind: "date" },
                { key: "price", label: "Fiyat", width: "0.9fr", kind: "number" },
                {
                  key: "currency",
                  label: "Birim",
                  width: "0.9fr",
                  kind: "select",
                  options: CURRENCIES,
                },
                {
                  key: "status",
                  label: "Durum",
                  width: "1.1fr",
                  kind: "select",
                  options: TRAVEL_STATUSES,
                },
                { key: "link", label: "Bağlantı", width: "1.6fr" },
              ]}
              rows={draft.travel}
              empty={EMPTY_TRAVEL}
              onChange={(travel) => patch({ travel })}
              addLabel="Seçenek ekle"
              emptyHint="Otel ve uçuş adaylarını ekleyip birini 'Seçildi' olarak işaretleyin."
              disabled={!canEdit}
            />
          </div>
        </div>
        {draft.travel.some((row) => row.link) ? (
          <ul className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5 text-xs">
            {draft.travel
              .filter((row) => row.link)
              .map((row, index) => (
                <li key={index}>
                  <a
                    href={row.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-muted-foreground underline-offset-4 hover:text-primary hover:underline"
                  >
                    <ExternalLink className="size-3" />
                    {row.name || row.kind || "Bağlantı"}
                  </a>
                </li>
              ))}
          </ul>
        ) : null}
      </Block>
    </div>
  );
}

function Block({
  icon: Icon,
  title,
  summary,
  children,
}: {
  icon: typeof ListChecks;
  title: string;
  summary?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="bento p-5">
      <header className="mb-4 flex flex-wrap items-center gap-2">
        <Icon className="size-4 text-muted-foreground" />
        <h3 className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
          {title}
        </h3>
        {summary ? (
          <span className="ml-auto text-sm font-medium">{summary}</span>
        ) : null}
      </header>
      {children}
    </section>
  );
}
