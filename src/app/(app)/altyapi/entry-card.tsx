"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { deleteInfraEntry } from "@/lib/infra/actions";
import {
  uploadAttachment,
  deleteAttachment,
  type UploadState,
} from "@/lib/infra/attachment-actions";
import { Button } from "@/components/ui/button";
import { INFRA_TYPES, type InfraEntry } from "@/lib/infra/types";

const TYPE_LABEL: Record<string, string> = Object.fromEntries(INFRA_TYPES);

export function EntryCard({
  entry,
  canDelete,
}: {
  entry: InfraEntry;
  canDelete: boolean;
}) {
  const router = useRouter();
  const [shown, setShown] = useState<Record<string, boolean>>({});
  const formRef = useRef<HTMLFormElement>(null);
  const upload = uploadAttachment.bind(null, entry.id);
  const [upState, uploadAction, uploading] = useActionState<
    UploadState,
    FormData
  >(upload, null);

  useEffect(() => {
    if (upState && "ok" in upState && upState.ok) {
      formRef.current?.reset();
      router.refresh();
    }
  }, [upState, router]);

  async function removeEntry() {
    if (!window.confirm(`"${entry.label}" silinsin mi?`)) return;
    await deleteInfraEntry(entry.id);
    router.refresh();
  }

  async function removeAttachment(id: string, name: string) {
    if (!window.confirm(`"${name}" eki silinsin mi?`)) return;
    await deleteAttachment(id);
    router.refresh();
  }

  return (
    <section className="space-y-3 rounded-lg border p-4">
      <header className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold">{entry.label}</h3>
          <p className="text-xs text-muted-foreground">
            {TYPE_LABEL[entry.type] ?? entry.type}
          </p>
        </div>
        {canDelete && (
          <Button
            variant="ghost"
            size="sm"
            onClick={removeEntry}
            className="text-destructive hover:text-destructive"
          >
            Sil
          </Button>
        )}
      </header>

      {entry.fields.length > 0 && (
        <dl className="grid grid-cols-[10rem_1fr] gap-x-4 gap-y-1 text-sm">
          {entry.fields.map((f) => (
            <div key={f.key} className="contents">
              <dt className="text-muted-foreground">{f.label}</dt>
              <dd className="flex items-center gap-2 font-mono">
                {f.sensitive && !shown[f.key] ? (
                  <span aria-label={`${f.label} gizli`}>{"•".repeat(8)}</span>
                ) : (
                  <span>{f.value}</span>
                )}
                {f.sensitive && (
                  <button
                    type="button"
                    onClick={() =>
                      setShown((s) => ({ ...s, [f.key]: !s[f.key] }))
                    }
                    className="text-xs text-muted-foreground underline"
                  >
                    {shown[f.key] ? "gizle" : "göster"}
                  </button>
                )}
              </dd>
            </div>
          ))}
        </dl>
      )}

      {entry.notes && (
        <p className="text-sm whitespace-pre-wrap">{entry.notes}</p>
      )}

      <div className="space-y-2 border-t pt-3">
        <p className="text-xs font-medium text-muted-foreground">Dosyalar</p>
        {entry.attachments.length === 0 ? (
          <p className="text-xs text-muted-foreground">Ek yok.</p>
        ) : (
          <ul className="space-y-1">
            {entry.attachments.map((a) => (
              <li key={a.id} className="flex items-center gap-2 text-sm">
                {a.url ? (
                  <a
                    href={a.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary underline"
                  >
                    {a.name}
                  </a>
                ) : (
                  <span>{a.name}</span>
                )}
                {canDelete && (
                  <button
                    type="button"
                    onClick={() => removeAttachment(a.id, a.name)}
                    className="text-xs text-destructive underline"
                  >
                    sil
                  </button>
                )}
              </li>
            ))}
          </ul>
        )}
        <form
          ref={formRef}
          action={uploadAction}
          className="flex items-center gap-2"
        >
          <input
            type="file"
            name="file"
            aria-label={`${entry.label} dosya`}
            className="text-xs"
          />
          <Button type="submit" size="sm" variant="outline" disabled={uploading}>
            {uploading ? "Yükleniyor..." : "Yükle"}
          </Button>
        </form>
        {upState && "error" in upState && (
          <p className="text-xs text-destructive">{upState.error}</p>
        )}
      </div>
    </section>
  );
}
