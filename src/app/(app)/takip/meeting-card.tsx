"use client";

import { useActionState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { addTrackUpdate, type SaveState } from "@/lib/track/actions";
import { UpdateList } from "./update-list";
import { StatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { BoardRow, TrackUpdate } from "@/lib/track/types";

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
    <section className="bento scroll-mt-6 p-5">
      <header className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <h2 className="font-display text-lg font-bold tracking-tight">
            {row.name}
          </h2>
          <StatusBadge status={row.record?.status ?? null} />
        </div>
        <Link
          href={`/musteriler/${row.customerId}`}
          className="press inline-flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          Detay
          <ArrowUpRight className="size-4" />
        </Link>
      </header>
      {row.record?.project ? (
        <p className="mt-1 text-sm text-muted-foreground">
          {row.record.project}
          {row.record.lead ? ` · ${row.record.lead}` : ""}
        </p>
      ) : null}

      <div className="mt-4 grid gap-5 lg:grid-cols-2">
        <div>
          <p className="mb-2 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
            Geçmiş
          </p>
          <UpdateList updates={updates} />
        </div>
        {canEdit ? (
          <form
            ref={formRef}
            action={action}
            className="space-y-2 rounded-2xl bg-muted/40 p-3.5"
          >
            <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
              Yeni güncelleme
            </p>
            <Input
              type="date"
              name="week_date"
              defaultValue={defaultWeek}
              className="w-44"
              aria-label={`${row.name} hafta`}
            />
            <Textarea
              name="body"
              rows={3}
              placeholder="Bu haftanın güncellemesi"
              aria-label={`${row.name} güncelleme`}
            />
            {state && "error" in state ? (
              <p className="text-sm text-destructive">{state.error}</p>
            ) : null}
            <Button type="submit" size="sm" className="press" disabled={pending}>
              {pending ? "Ekleniyor..." : "Güncelleme ekle"}
            </Button>
          </form>
        ) : null}
      </div>
    </section>
  );
}
