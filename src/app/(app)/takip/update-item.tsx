"use client";

import { useActionState, useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Pencil, Trash2 } from "lucide-react";
import {
  editTrackUpdate,
  deleteTrackUpdate,
  type SaveState,
} from "@/lib/track/actions";
import { useConfirm } from "@/components/ui/confirm-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { TrackUpdate } from "@/lib/track/types";

type Props = {
  update: TrackUpdate;
  weekLabel: string;
  canEdit: boolean;
};

export function UpdateItem({ update, weekLabel, canEdit }: Props) {
  const router = useRouter();
  const confirm = useConfirm();
  const [editing, setEditing] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [deletePending, startDelete] = useTransition();

  const edit = editTrackUpdate.bind(null, update.id);
  const [state, action, pending] = useActionState<SaveState, FormData>(
    edit,
    null,
  );

  useEffect(() => {
    if (state && "ok" in state && state.ok) {
      setEditing(false);
      router.refresh();
    }
  }, [state, router]);

  async function handleDelete() {
    const ok = await confirm({
      title: "Güncellemeyi sil",
      description: (
        <>
          <strong>{weekLabel}</strong> tarihli güncelleme kalıcı olarak
          silinecek.
        </>
      ),
      confirmLabel: "Sil",
    });
    if (!ok) return;
    startDelete(async () => {
      const result = await deleteTrackUpdate(update.id);
      setDeleteError(result.error ?? null);
      if (!result.error) router.refresh();
    });
  }

  if (editing) {
    return (
      <form action={action} className="space-y-2 rounded-xl bg-muted/40 p-3">
        <Input
          type="date"
          name="week_date"
          defaultValue={update.week_date}
          className="w-44"
          aria-label="Güncelleme tarihi"
        />
        <Textarea
          name="body"
          rows={3}
          defaultValue={update.body}
          aria-label="Güncelleme metni"
        />
        {state && "error" in state ? (
          <p className="text-sm text-destructive">{state.error}</p>
        ) : null}
        <div className="flex items-center gap-2">
          <Button type="submit" size="sm" className="press" disabled={pending}>
            {pending ? "Kaydediliyor..." : "Kaydet"}
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="press"
            onClick={() => setEditing(false)}
            disabled={pending}
          >
            Vazgeç
          </Button>
        </div>
      </form>
    );
  }

  return (
    <div className="group/update">
      <div className="flex items-start justify-between gap-2">
        <p className="text-xs font-medium tabular-nums text-muted-foreground">
          {weekLabel}
        </p>
        {canEdit ? (
          <div className="flex items-center gap-0.5 opacity-0 transition-opacity group-hover/update:opacity-100 focus-within:opacity-100">
            <button
              type="button"
              onClick={() => setEditing(true)}
              aria-label={`${weekLabel} güncellemesini düzenle`}
              className="press grid size-6 place-items-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
            >
              <Pencil className="size-3.5" />
            </button>
            <button
              type="button"
              onClick={handleDelete}
              disabled={deletePending}
              aria-label={`${weekLabel} güncellemesini sil`}
              className="press grid size-6 place-items-center rounded-md text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none disabled:opacity-50"
            >
              <Trash2 className="size-3.5" />
            </button>
          </div>
        ) : null}
      </div>
      <p className="mt-0.5 text-sm whitespace-pre-wrap">{update.body}</p>
      {deleteError ? (
        <p className="mt-1 text-sm text-destructive">{deleteError}</p>
      ) : null}
    </div>
  );
}
