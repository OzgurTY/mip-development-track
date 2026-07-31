"use client";

import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { saveEvent, type SaveState } from "@/lib/events/actions";
import { RepeatFields } from "./repeat-fields";
import { FormSection } from "@/components/form-section";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  EVENT_STATUSES,
  PARTICIPATIONS,
  PARTICIPATION_LABEL,
  STATUS_LABEL,
  type EventItem,
  type EventType,
} from "@/lib/events/types";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Dolu ise duzenleme, bos ise yeni kayit. */
  event?: EventItem | null;
  /** Takvimde bir gune tiklanarak acildiysa on dolu baslangic tarihi. */
  initialDate?: string;
  types: EventType[];
  customers: { id: string; name: string }[];
  owners: { id: string; name: string }[];
};

export function EventDialog({
  open,
  onOpenChange,
  event,
  initialDate,
  types,
  customers,
  owners,
}: Props) {
  const router = useRouter();
  const isEdit = Boolean(event);
  const [state, formAction, pending] = useActionState<SaveState, FormData>(
    saveEvent.bind(null, event?.id ?? null),
    null,
  );

  useEffect(() => {
    if (state && "ok" in state && state.ok) {
      onOpenChange(false);
      router.refresh();
    }
  }, [state, onOpenChange, router]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[88vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? "Etkinliği düzenle" : "Yeni etkinlik"}
          </DialogTitle>
        </DialogHeader>
        {open ? (
          <EventForm
            key={`${event?.id ?? "yeni"}-${initialDate ?? ""}`}
            event={event}
            initialDate={initialDate}
            types={types}
            customers={customers}
            owners={owners}
            formAction={formAction}
            state={state}
            pending={pending}
          />
        ) : null}
      </DialogContent>
    </Dialog>
  );
}

/**
 * Form govdesi ayri bilesende: diyalog kapaninca alan durumlari (baslangic
 * tarihi, tekrar kurali) kendiliginden sifirlanir.
 */
function EventForm({
  event,
  initialDate,
  types,
  customers,
  owners,
  formAction,
  state,
  pending,
}: {
  event?: EventItem | null;
  initialDate?: string;
  types: EventType[];
  customers: { id: string; name: string }[];
  owners: { id: string; name: string }[];
  formAction: (formData: FormData) => void;
  state: SaveState;
  pending: boolean;
}) {
  const isEdit = Boolean(event);
  const [startDate, setStartDate] = useState(
    event?.start_date ?? initialDate ?? "",
  );

  return (
    <form action={formAction} className="space-y-5">
      <FormSection>
        <div className="space-y-1.5">
          <Label htmlFor="title">Başlık</Label>
          <Input
            id="title"
            name="title"
            required
            autoFocus
            maxLength={200}
            defaultValue={event?.title ?? ""}
            placeholder="Örn. APIdays Paris 2026"
            className="h-10 rounded-xl px-3"
          />
        </div>
        <div className="grid gap-3 sm:grid-cols-3">
          <Field label="Tip" htmlFor="type">
            <Select id="type" name="type" defaultValue={event?.type ?? ""}>
              <option value="">Seçiniz</option>
              {types.map((type) => (
                <option key={type.key} value={type.key}>
                  {type.label}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Durum" htmlFor="status">
            <Select
              id="status"
              name="status"
              defaultValue={event?.status ?? "aday"}
            >
              {EVENT_STATUSES.map((status) => (
                <option key={status} value={status}>
                  {STATUS_LABEL[status]}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Katılım şekli" htmlFor="participation">
            <Select
              id="participation"
              name="participation"
              defaultValue={event?.participation ?? ""}
            >
              <option value="">Belirsiz</option>
              {PARTICIPATIONS.map((value) => (
                <option key={value} value={value}>
                  {PARTICIPATION_LABEL[value]}
                </option>
              ))}
            </Select>
          </Field>
        </div>
      </FormSection>

      <FormSection title="Tarih">
        <div className="grid gap-3 sm:grid-cols-4">
          <Field label="Başlangıç" htmlFor="start_date">
            <Input
              id="start_date"
              name="start_date"
              type="date"
              required
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="h-10 rounded-xl px-3"
            />
          </Field>
          <Field label="Bitiş" htmlFor="end_date">
            <Input
              id="end_date"
              name="end_date"
              type="date"
              defaultValue={event?.end_date ?? ""}
              className="h-10 rounded-xl px-3"
            />
          </Field>
          <Field label="Başlama saati" htmlFor="start_time">
            <Input
              id="start_time"
              name="start_time"
              type="time"
              defaultValue={event?.start_time?.slice(0, 5) ?? ""}
              className="h-10 rounded-xl px-3"
            />
          </Field>
          <Field label="Bitiş saati" htmlFor="end_time">
            <Input
              id="end_time"
              name="end_time"
              type="time"
              defaultValue={event?.end_time?.slice(0, 5) ?? ""}
              className="h-10 rounded-xl px-3"
            />
          </Field>
        </div>
        <p className="text-xs text-muted-foreground">
          Tek günlük etkinlikte bitiş boş kalabilir. Saat yalnızca gerekiyorsa
          girilir.
        </p>
      </FormSection>

      <FormSection
        title="Tekrar"
        description="Düzenli etkinlikler tek kayıtta tutulur, takvimde otomatik çoğaltılır."
      >
        <RepeatFields event={event} startDate={startDate} />
      </FormSection>

      <FormSection title="Yer">
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            name="is_online"
            value="true"
            defaultChecked={event?.is_online ?? false}
            className="size-4 rounded border-input"
          />
          Çevrimiçi etkinlik
        </label>
        <div className="grid gap-3 sm:grid-cols-3">
          <Field label="Şehir" htmlFor="city">
            <Input
              id="city"
              name="city"
              defaultValue={event?.city ?? ""}
              className="h-10 rounded-xl px-3"
            />
          </Field>
          <Field label="Ülke" htmlFor="country">
            <Input
              id="country"
              name="country"
              defaultValue={event?.country ?? ""}
              className="h-10 rounded-xl px-3"
            />
          </Field>
          <Field label="Mekan" htmlFor="venue">
            <Input
              id="venue"
              name="venue"
              defaultValue={event?.venue ?? ""}
              className="h-10 rounded-xl px-3"
            />
          </Field>
        </div>
        <Field label="Web sitesi" htmlFor="website">
          <Input
            id="website"
            name="website"
            defaultValue={event?.website ?? ""}
            placeholder="https://..."
            className="h-10 rounded-xl px-3"
          />
        </Field>
      </FormSection>

      <FormSection title="Planlama">
        <div className="grid gap-3 sm:grid-cols-3">
          <Field label="Son başvuru tarihi" htmlFor="deadline_date">
            <Input
              id="deadline_date"
              name="deadline_date"
              type="date"
              defaultValue={event?.deadline_date ?? ""}
              className="h-10 rounded-xl px-3"
            />
          </Field>
          <Field label="Sorumlu" htmlFor="owner_id">
            <Select
              id="owner_id"
              name="owner_id"
              defaultValue={event?.owner_id ?? ""}
            >
              <option value="">Seçiniz</option>
              {owners.map((owner) => (
                <option key={owner.id} value={owner.id}>
                  {owner.name}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="İlgili müşteri" htmlFor="customer_id">
            <Select
              id="customer_id"
              name="customer_id"
              defaultValue={event?.customer_id ?? ""}
            >
              <option value="">Yok</option>
              {customers.map((customer) => (
                <option key={customer.id} value={customer.id}>
                  {customer.name}
                </option>
              ))}
            </Select>
          </Field>
        </div>
      </FormSection>

      <FormSection title="Notlar">
        <Field label="Özet / neden katılıyoruz" htmlFor="summary">
          <Textarea
            id="summary"
            name="summary"
            rows={3}
            defaultValue={event?.summary ?? ""}
            className="rounded-xl"
          />
        </Field>
        {isEdit ? (
          <Field label="Değerlendirme (etkinlik sonrası)" htmlFor="outcome">
            <Textarea
              id="outcome"
              name="outcome"
              rows={2}
              defaultValue={event?.outcome ?? ""}
              className="rounded-xl"
            />
          </Field>
        ) : null}
      </FormSection>

      {state && "error" in state ? (
        <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {state.error}
        </p>
      ) : null}

      <Button
        type="submit"
        size="lg"
        className="press h-10 w-full"
        disabled={pending}
      >
        {pending ? "Kaydediliyor..." : isEdit ? "Kaydet" : "Etkinlik ekle"}
      </Button>
    </form>
  );
}

function Field({
  label,
  htmlFor,
  children,
}: {
  label: string;
  htmlFor: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={htmlFor}>{label}</Label>
      {children}
    </div>
  );
}
