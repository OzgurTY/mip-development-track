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
  Users,
  Plus,
  Database,
  Pencil,
} from "lucide-react";
import { deleteInfraEntry } from "@/lib/infra/actions";
import {
  uploadAttachment,
  deleteAttachment,
  type UploadState,
} from "@/lib/infra/attachment-actions";
import {
  addCredential,
  deleteCredential,
  type CredState,
} from "@/lib/infra/credential-actions";
import { EntryForm } from "./entry-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CopyButton } from "@/components/copy-button";
import {
  type InfraEntry,
  type Credential,
  type InfraType,
} from "@/lib/infra/types";
import type { FieldDefinition } from "@/lib/fields/types";
import type { LucideIcon } from "lucide-react";

const TYPE_ICON: Record<string, LucideIcon> = {
  sunucu: Server,
  mip: Cog,
  baglanti: Network,
  vpn: ShieldEllipsis,
  veritabani: Database,
  diger: KeyRound,
};

const ROLE_SUGGESTIONS = [
  "SSH",
  "Servis SFTP",
  "PostgreSQL",
  "Web Login",
  "Servis Kullanıcı",
];

// Kimlikleri rol/gruba göre, ilk görülme sırasını koruyarak grupla.
function groupCredentials(creds: Credential[]) {
  const order: string[] = [];
  const map = new Map<string, Credential[]>();
  for (const c of creds) {
    const key = c.role?.trim() ?? "";
    if (!map.has(key)) {
      map.set(key, []);
      order.push(key);
    }
    map.get(key)!.push(c);
  }
  return order.map((role) => ({ role, items: map.get(role)! }));
}

export function EntryCard({
  entry,
  canDelete,
  defs,
  types,
}: {
  entry: InfraEntry;
  canDelete: boolean;
  defs: FieldDefinition[];
  types: InfraType[];
}) {
  const router = useRouter();
  const [shown, setShown] = useState<Record<string, boolean>>({});
  const [credShown, setCredShown] = useState<Record<string, boolean>>({});
  const fileFormRef = useRef<HTMLFormElement>(null);
  const credFormRef = useRef<HTMLFormElement>(null);

  const upload = uploadAttachment.bind(null, entry.id);
  const [upState, uploadAction, uploading] = useActionState<
    UploadState,
    FormData
  >(upload, null);
  useEffect(() => {
    if (upState && "ok" in upState && upState.ok) {
      fileFormRef.current?.reset();
      router.refresh();
    }
  }, [upState, router]);

  const addCred = addCredential.bind(null, entry.id);
  const [credState, credAction, credPending] = useActionState<
    CredState,
    FormData
  >(addCred, null);
  useEffect(() => {
    if (credState && "ok" in credState && credState.ok) {
      credFormRef.current?.reset();
      router.refresh();
    }
  }, [credState, router]);

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
  async function removeCredential(id: string, username: string) {
    if (!window.confirm(`"${username}" kimliği silinsin mi?`)) return;
    await deleteCredential(id);
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
            <p className="text-xs text-muted-foreground">{entry.typeLabel}</p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <EntryForm
            customerId={entry.customer_id}
            defs={defs}
            types={types}
            entry={entry}
            trigger={
              <button
                type="button"
                aria-label="Kaydı düzenle"
                className="press grid size-8 place-items-center rounded-lg text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
              >
                <Pencil className="size-4" />
              </button>
            }
          />
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
        </div>
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
                <CopyButton value={f.value} label={`${f.label} kopyala`} />
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

      {/* Kimlikler (çoklu kullanıcı) */}
      <div className="mt-4 space-y-2 border-t border-border/60 pt-3">
        <p className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
          <Users className="size-3.5" />
          Kimlikler
        </p>
        {entry.credentials.length === 0 ? (
          <p className="text-xs text-muted-foreground">Kimlik yok.</p>
        ) : (
          <div className="space-y-2.5">
            {groupCredentials(entry.credentials).map((g) => (
              <div key={g.role || "_"} className="space-y-1">
                {g.role ? (
                  <p className="text-[0.7rem] font-semibold tracking-wide text-muted-foreground/70 uppercase">
                    {g.role}
                  </p>
                ) : null}
                <ul className="space-y-1.5">
                  {g.items.map((c) => (
                    <li
                      key={c.id}
                      className="flex flex-wrap items-center gap-x-2.5 gap-y-1 rounded-xl bg-muted/40 px-3 py-2 text-sm"
                    >
                      <span className="font-mono font-medium">{c.username}</span>
                      {c.secret ? (
                        <span className="flex items-center gap-1.5 font-mono text-xs text-muted-foreground">
                          {credShown[c.id] ? c.secret : "••••••••"}
                          <button
                            type="button"
                            onClick={() =>
                              setCredShown((s) => ({ ...s, [c.id]: !s[c.id] }))
                            }
                            aria-label={credShown[c.id] ? "Gizle" : "Göster"}
                            className="press text-muted-foreground transition-colors hover:text-foreground"
                          >
                            {credShown[c.id] ? (
                              <EyeOff className="size-3.5" />
                            ) : (
                              <Eye className="size-3.5" />
                            )}
                          </button>
                          <CopyButton
                            value={c.secret}
                            label={`${c.username} parolası kopyala`}
                          />
                        </span>
                      ) : null}
                      {c.note ? (
                        <span className="truncate text-xs text-muted-foreground">
                          {c.note}
                        </span>
                      ) : null}
                      {canDelete ? (
                        <button
                          type="button"
                          onClick={() => removeCredential(c.id, c.username)}
                          aria-label="Kimliği sil"
                          className="press ml-auto text-muted-foreground transition-colors hover:text-destructive"
                        >
                          <X className="size-3.5" />
                        </button>
                      ) : null}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        )}
        <form
          ref={credFormRef}
          action={credAction}
          className="flex flex-wrap items-center gap-1.5"
        >
          <Input
            name="username"
            placeholder="Kullanıcı"
            aria-label="Kullanıcı adı"
            className="h-8 w-32"
          />
          <Input
            name="password"
            type="password"
            placeholder="Parola"
            autoComplete="new-password"
            aria-label="Parola"
            className="h-8 w-32"
          />
          <Input
            name="role"
            placeholder="Grup / Rol"
            aria-label="Grup veya rol"
            list="cred-roles"
            className="h-8 w-32"
          />
          <datalist id="cred-roles">
            {ROLE_SUGGESTIONS.map((r) => (
              <option key={r} value={r} />
            ))}
          </datalist>
          <Input
            name="note"
            placeholder="Not"
            aria-label="Not"
            className="h-8 w-28"
          />
          <Button
            type="submit"
            size="sm"
            variant="outline"
            className="press gap-1"
            disabled={credPending}
          >
            <Plus className="size-3.5" />
            Ekle
          </Button>
        </form>
        {credState && "error" in credState ? (
          <p className="text-xs text-destructive">{credState.error}</p>
        ) : null}
      </div>

      {/* Dosyalar */}
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
          ref={fileFormRef}
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
