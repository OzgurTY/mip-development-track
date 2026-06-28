"use client";

import { useActionState, useEffect, useState } from "react";
import { Pencil } from "lucide-react";
import { saveTrackRecord, type SaveState } from "@/lib/track/actions";
import { DynamicFields } from "@/components/fields/dynamic-fields";
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
          <Button variant="outline" size="sm" className="press gap-1.5">
            <Pencil className="size-3.5" />
            Düzenle
          </Button>
        }
      />
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{name} - takip</DialogTitle>
        </DialogHeader>
        {open ? (
        <form action={action} className="space-y-5">
          <FormSection>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="status">Durum</Label>
                <Select id="status" name="status" defaultValue={record?.status ?? ""}>
                  <option value="">Belirsiz</option>
                  {TRACK_STATUSES.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="project">Proje</Label>
                <Input
                  id="project"
                  name="project"
                  defaultValue={record?.project ?? ""}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="lead">Lead</Label>
                <Input id="lead" name="lead" defaultValue={record?.lead ?? ""} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="responsibles">Bilinen Sorumlular</Label>
                <Input
                  id="responsibles"
                  name="responsibles"
                  defaultValue={record?.responsibles ?? ""}
                  placeholder="Virgülle ayır"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="scope">Proje kapsamı</Label>
              <Textarea
                id="scope"
                name="scope"
                defaultValue={record?.scope ?? ""}
              />
            </div>
          </FormSection>

          {defs.length > 0 ? (
            <FormSection title="Özel alanlar">
              <DynamicFields defs={defs} values={record?.custom_fields} />
            </FormSection>
          ) : null}

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
            {pending ? "Kaydediliyor..." : "Kaydet"}
          </Button>
        </form>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
