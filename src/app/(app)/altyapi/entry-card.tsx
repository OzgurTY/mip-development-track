"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { deleteInfraEntry } from "@/lib/infra/actions";
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

  async function remove() {
    if (!window.confirm(`"${entry.label}" silinsin mi?`)) return;
    await deleteInfraEntry(entry.id);
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
            onClick={remove}
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
    </section>
  );
}
