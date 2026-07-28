"use client";

import type { ReactNode } from "react";
import { RowEditor } from "./row-editor";
import { ProcessEditor } from "./process-editor";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  DEPLOYMENT_OPTIONS,
  EMPTY_CRITERION,
  EMPTY_WORK,
} from "@/lib/poc/defaults";
import {
  CRITERION_STATUSES,
  POC_RESULTS,
  POC_SECTIONS,
  POC_STATUSES,
  WORK_STATUSES,
} from "@/lib/poc/types";
import type { PocDraft } from "@/lib/poc/schema";

type Props = {
  draft: PocDraft;
  onPatch: (patch: Partial<PocDraft>) => void;
  disabled?: boolean;
  /** Kayitli musteri adlari; serbest metin alanina oneri olarak sunulur. */
  customerOptions: string[];
};

export function PocForm({ draft, onPatch, disabled, customerOptions }: Props) {
  return (
    <div className="space-y-4">
      <Block title="Künye">
        <Field label="Müşteri / firma" htmlFor="customer_name" full>
          <Input
            id="customer_name"
            list="poc-customer-options-edit"
            autoComplete="off"
            value={draft.customer_name}
            disabled={disabled}
            maxLength={200}
            onChange={(e) => onPatch({ customer_name: e.target.value })}
            className="h-10 rounded-xl px-3"
          />
          <datalist id="poc-customer-options-edit">
            {customerOptions.map((name) => (
              <option key={name} value={name} />
            ))}
          </datalist>
        </Field>
        <Field label="PoC konusu" htmlFor="title" full>
          <Input
            id="title"
            value={draft.title}
            disabled={disabled}
            maxLength={200}
            onChange={(e) => onPatch({ title: e.target.value })}
            className="h-10 rounded-xl px-3"
          />
        </Field>
        <Field label="Durum" htmlFor="status">
          <Select
            id="status"
            value={draft.status}
            disabled={disabled}
            onChange={(e) => onPatch({ status: e.target.value })}
          >
            {POC_STATUSES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Genel sonuç" htmlFor="result">
          <Select
            id="result"
            value={draft.result}
            disabled={disabled}
            onChange={(e) => onPatch({ result: e.target.value })}
          >
            <option value="">Belirlenmedi</option>
            {POC_RESULTS.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Başlangıç" htmlFor="start_date">
          <Input
            id="start_date"
            type="date"
            value={draft.start_date}
            disabled={disabled}
            onChange={(e) => onPatch({ start_date: e.target.value })}
            className="h-10 rounded-xl px-3"
          />
        </Field>
        <Field label="Bitiş" htmlFor="end_date">
          <Input
            id="end_date"
            type="date"
            value={draft.end_date}
            disabled={disabled}
            onChange={(e) => onPatch({ end_date: e.target.value })}
            className="h-10 rounded-xl px-3"
          />
        </Field>
        <Field label="Kurulum" htmlFor="deployment" full>
          <Select
            id="deployment"
            value={draft.deployment}
            disabled={disabled}
            onChange={(e) => onPatch({ deployment: e.target.value })}
          >
            <option value="">Seçiniz</option>
            {DEPLOYMENT_OPTIONS.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="MDP ekibi" htmlFor="team_mdp">
          <Input
            id="team_mdp"
            value={draft.team_mdp}
            disabled={disabled}
            onChange={(e) => onPatch({ team_mdp: e.target.value })}
            className="h-10 rounded-xl px-3"
          />
        </Field>
        <Field label="Müşteri ekibi" htmlFor="team_customer">
          <Input
            id="team_customer"
            value={draft.team_customer}
            disabled={disabled}
            onChange={(e) => onPatch({ team_customer: e.target.value })}
            className="h-10 rounded-xl px-3"
          />
        </Field>
      </Block>

      <Block title={POC_SECTIONS.scope}>
        <Field label="Amaç" htmlFor="purpose" full>
          <Textarea
            id="purpose"
            rows={3}
            value={draft.purpose}
            disabled={disabled}
            placeholder="PoC neden yapıldı, ne test edildi: 2-3 cümle"
            onChange={(e) => onPatch({ purpose: e.target.value })}
            className="rounded-xl"
          />
        </Field>
        <Field label="Kapsam dışı" htmlFor="out_of_scope" full>
          <Textarea
            id="out_of_scope"
            rows={2}
            value={draft.out_of_scope}
            disabled={disabled}
            placeholder="PoC kapsamında ele alınmayan konular"
            onChange={(e) => onPatch({ out_of_scope: e.target.value })}
            className="rounded-xl"
          />
        </Field>
      </Block>

      <Block title={POC_SECTIONS.install}>
        <Field label="Sunucu" htmlFor="server_info" full>
          <Input
            id="server_info"
            value={draft.server_info}
            disabled={disabled}
            placeholder="Müşteri tarafından tahsis edildi - sunucu adı / IP"
            onChange={(e) => onPatch({ server_info: e.target.value })}
            className="h-10 rounded-xl px-3"
          />
        </Field>
        <Field label="İşletim sistemi ve kaynak" htmlFor="os_info">
          <Input
            id="os_info"
            value={draft.os_info}
            disabled={disabled}
            placeholder="Ubuntu 22.04, 4 vCPU, 16 GB"
            onChange={(e) => onPatch({ os_info: e.target.value })}
            className="h-10 rounded-xl px-3"
          />
        </Field>
        <Field label="MIP sürümü" htmlFor="mip_version">
          <Input
            id="mip_version"
            value={draft.mip_version}
            disabled={disabled}
            onChange={(e) => onPatch({ mip_version: e.target.value })}
            className="h-10 rounded-xl px-3"
          />
        </Field>
        <Field label="Kurulum tarihi" htmlFor="install_date">
          <Input
            id="install_date"
            type="date"
            value={draft.install_date}
            disabled={disabled}
            onChange={(e) => onPatch({ install_date: e.target.value })}
            className="h-10 rounded-xl px-3"
          />
        </Field>
        <Field label="Kurulum sonucu" htmlFor="install_result">
          <Input
            id="install_result"
            value={draft.install_result}
            disabled={disabled}
            placeholder="Sorunsuz tamamlandı"
            onChange={(e) => onPatch({ install_result: e.target.value })}
            className="h-10 rounded-xl px-3"
          />
        </Field>
        <Field label="Sistem erişimleri" htmlFor="access_note" full>
          <Textarea
            id="access_note"
            rows={2}
            value={draft.access_note}
            disabled={disabled}
            placeholder="Kaynak ve hedef sistem kullanıcıları ve ağ erişimleri alındı"
            onChange={(e) => onPatch({ access_note: e.target.value })}
            className="rounded-xl"
          />
        </Field>
      </Block>

      <Block
        title={POC_SECTIONS.works}
        description="Kurulumdan teste kadar atılan adımlar ve tarihleri. Gerekmeyen satırı silin."
      >
        <div className="sm:col-span-2">
          <RowEditor
            columns={[
              { key: "name", label: "İş", width: "3fr" },
              {
                key: "status",
                label: "Durum",
                width: "1.1fr",
                kind: "select",
                options: WORK_STATUSES,
              },
              { key: "date", label: "Tarih", width: "1fr", kind: "date" },
            ]}
            rows={draft.works}
            empty={EMPTY_WORK}
            onChange={(works) => onPatch({ works })}
            addLabel="İş adımı ekle"
            disabled={disabled}
          />
        </div>
      </Block>

      <Block
        title={POC_SECTIONS.processes}
        description="Her süreç kendi mesaj sonucunu ve kendi kabul kriterlerini taşır."
      >
        <div className="sm:col-span-2">
          <ProcessEditor
            processes={draft.processes}
            onChange={(processes) => onPatch({ processes })}
            disabled={disabled}
          />
        </div>
      </Block>

      <Block
        title={POC_SECTIONS.criteria}
        description="Süreçten bağımsız, PoC genelinde geçerli kriterler."
      >
        <div className="sm:col-span-2">
          <RowEditor
            columns={[
              { key: "text", label: "Kriter", width: "3fr" },
              {
                key: "status",
                label: "Durum",
                width: "1.2fr",
                kind: "select",
                options: CRITERION_STATUSES,
              },
              { key: "note", label: "Not", width: "1.4fr" },
            ]}
            rows={draft.criteria}
            empty={EMPTY_CRITERION}
            onChange={(criteria) => onPatch({ criteria })}
            addLabel="Kriter ekle"
            disabled={disabled}
          />
        </div>
      </Block>
    </div>
  );
}

function Block({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <section className="bento p-5">
      <h2 className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
        {title}
      </h2>
      {description ? (
        <p className="mt-1 text-xs text-muted-foreground">{description}</p>
      ) : null}
      <div className="mt-4 grid gap-4 sm:grid-cols-2">{children}</div>
    </section>
  );
}

function Field({
  label,
  htmlFor,
  full,
  children,
}: {
  label: string;
  htmlFor: string;
  full?: boolean;
  children: ReactNode;
}) {
  return (
    <div className={`space-y-1.5 ${full ? "sm:col-span-2" : ""}`}>
      <Label htmlFor={htmlFor}>{label}</Label>
      {children}
    </div>
  );
}
