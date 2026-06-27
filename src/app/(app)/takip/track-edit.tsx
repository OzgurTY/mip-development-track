"use client";

import { useActionState, useEffect, useState } from "react";
import { saveTrackRecord, type SaveState } from "@/lib/track/actions";
import { DynamicFields } from "@/components/fields/dynamic-fields";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { TRACK_STATUSES, type TrackRecord } from "@/lib/track/types";
import type { FieldDefinition } from "@/lib/fields/types";

type Props = {
  customerId: string;
  name: string;
  record: TrackRecord | null;
  defs: FieldDefinition[];
};

export function TrackEdit({ customerId, name, record, defs }: Props) {
  const [open, setOpen] = useState(false);
  const save = saveTrackRecord.bind(null, customerId);
  const [state, action, pending] = useActionState<SaveState, FormData>(
    save,
    null,
  );

  useEffect(() => {
    if (state && "ok" in state && state.ok) setOpen(false);
  }, [state]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button variant="ghost" size="sm">
            Düzenle
          </Button>
        }
      />
      <DialogContent className="max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{name}</DialogTitle>
        </DialogHeader>
        <form action={action} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="status">Durum</Label>
            <select
              id="status"
              name="status"
              defaultValue={record?.status ?? ""}
              className="h-9 w-full rounded-md border bg-transparent px-3 text-sm"
            >
              <option value="">Belirsiz</option>
              {TRACK_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="project">Proje</Label>
            <Input id="project" name="project" defaultValue={record?.project ?? ""} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="scope">Proje kapsamı</Label>
            <Textarea id="scope" name="scope" defaultValue={record?.scope ?? ""} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="lead">Lead</Label>
            <Input id="lead" name="lead" defaultValue={record?.lead ?? ""} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="responsibles">Sorumlular</Label>
            <Input
              id="responsibles"
              name="responsibles"
              defaultValue={record?.responsibles ?? ""}
              placeholder="Virgülle ayır"
            />
          </div>
          <DynamicFields defs={defs} />
          {state && "error" in state && (
            <p className="text-sm text-destructive">{state.error}</p>
          )}
          <Button type="submit" disabled={pending}>
            {pending ? "Kaydediliyor..." : "Kaydet"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
