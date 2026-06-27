"use client";

import { useActionState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { addTrackUpdate, type SaveState } from "@/lib/track/actions";
import { UpdateList } from "./update-list";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { BoardRow, TrackUpdate } from "@/lib/track/types";

const STATUS_TONE: Record<string, string> = {
  Aktif: "bg-chart-3/15",
  Stabil: "bg-chart-1/15",
  Beklemede: "bg-chart-4/20",
  İnaktif: "bg-muted",
};

type Props = {
  row: BoardRow;
  updates: TrackUpdate[];
  defaultWeek: string;
  canEdit: boolean;
};

export function MeetingCard({ row, updates, defaultWeek, canEdit }: Props) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const add = addTrackUpdate.bind(null, row.customerId);
  const [state, action, pending] = useActionState<SaveState, FormData>(
    add,
    null,
  );

  useEffect(() => {
    if (state && "ok" in state && state.ok) {
      formRef.current?.reset();
      router.refresh();
    }
  }, [state, router]);

  return (
    <section className="space-y-3 rounded-lg border p-4">
      <header className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">{row.name}</h2>
        {row.record?.status && (
          <span
            className={`rounded-full px-2 py-0.5 text-xs ${
              STATUS_TONE[row.record.status] ?? "bg-muted"
            }`}
          >
            {row.record.status}
          </span>
        )}
      </header>
      {row.record?.project && (
        <p className="text-sm text-muted-foreground">
          {row.record.project}
          {row.record.lead ? ` · ${row.record.lead}` : ""}
        </p>
      )}
      <UpdateList updates={updates} />
      {canEdit && (
        <form ref={formRef} action={action} className="space-y-2 border-t pt-3">
          <Input
            type="date"
            name="week_date"
            defaultValue={defaultWeek}
            className="w-40"
            aria-label={`${row.name} hafta`}
          />
          <Textarea
            name="body"
            placeholder="Bu haftanın güncellemesi"
            aria-label={`${row.name} güncelleme`}
          />
          {state && "error" in state && (
            <p className="text-sm text-destructive">{state.error}</p>
          )}
          <Button type="submit" size="sm" disabled={pending}>
            {pending ? "Ekleniyor..." : "Güncelleme ekle"}
          </Button>
        </form>
      )}
    </section>
  );
}
