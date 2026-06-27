"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Server,
  Network,
  KeyRound,
  Cog,
  ShieldEllipsis,
  Eye,
  EyeOff,
  Trash2,
  Paperclip,
  Upload,
  X,
} from "lucide-react";
import { deleteInfraEntry } from "@/lib/infra/actions";
import {
  uploadAttachment,
  deleteAttachment,
  type UploadState,
} from "@/lib/infra/attachment-actions";
import { Button } from "@/components/ui/button";
import { INFRA_TYPES, type InfraEntry } from "@/lib/infra/types";
import type { LucideIcon } from "lucide-react";

const TYPE_LABEL: Record<string, string> = Object.fromEntries(INFRA_TYPES);
const TYPE_ICON: Record<string, LucideIcon> = {
  sunucu: Server,
  mip: Cog,
  baglanti: Network,
  vpn: ShieldEllipsis,
  diger: KeyRound,
};

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

  const Icon = TYPE_ICON[entry.type] ?? KeyRound;

  return (
    <section className="bento bento-hover p-5">
      <header className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="grid size-10 place-items-center rounded-2xl bg-accent text-primary">
            <Icon className="size-5" strokeWidth={2.25} />
          </span>
          <div>
            <h3 className="font-semibold">{entry.label}</h3>
            <p className="text-xs text-muted-foreground">
              {TYPE_LABEL[entry.type] ?? entry.type}
            </p>
          </div>
        </div>
        {canDelete && (
          <button
            type="button"
            onClick={removeEntry}
            aria-label="Kaydı sil"
            className="press grid size-8 place-items-center rounded-lg text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
          >
            <Trash2 className="size-4" />
          </button>
        )}
      </header>

      {entry.fields.length > 0 && (
        <dl className="mt-4 grid grid-cols-[9rem_1fr] gap-x-4 gap-y-1.5 text-sm">
          {entry.fields.map((f) => (
            <div key={f.key} className="contents">
              <dt className="text-muted-foreground">{f.label}</dt>
              <dd className="flex items-center gap-2 font-mono text-xs">
                {f.sensitive && !shown[f.key] ? (
                  <span aria-label={`${f.label} gizli`}>{"•".repeat(8)}</span>
                ) : (
                  <span className="break-all">{f.value}</span>
                )}
                {f.sensitive && (
                  <button
                    type="button"
                    onClick={() =>
                      setShown((s) => ({ ...s, [f.key]: !s[f.key] }))
                    }
                    aria-label={shown[f.key] ? "Gizle" : "Göster"}
                    className="press text-muted-foreground transition-colors hover:text-foreground"
                  >
                    {shown[f.key] ? (
                      <EyeOff className="size-3.5" />
                    ) : (
                      <Eye className="size-3.5" />
                    )}
                  </button>
                )}
              </dd>
            </div>
          ))}
        </dl>
      )}

      {entry.notes && (
        <p className="mt-3 text-sm whitespace-pre-wrap text-muted-foreground">
          {entry.notes}
        </p>
      )}

      <div className="mt-4 space-y-2 border-t border-border/60 pt-3">
        <p className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
          <Paperclip className="size-3.5" />
          Dosyalar
        </p>
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
                    className="text-primary underline-offset-4 hover:underline"
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
                    aria-label="Eki sil"
                    className="press text-muted-foreground transition-colors hover:text-destructive"
                  >
                    <X className="size-3.5" />
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
            className="text-xs file:mr-2 file:rounded-md file:border-0 file:bg-accent file:px-2 file:py-1 file:text-accent-foreground"
          />
          <Button
            type="submit"
            size="sm"
            variant="outline"
            className="press gap-1"
            disabled={uploading}
          >
            <Upload className="size-3.5" />
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
