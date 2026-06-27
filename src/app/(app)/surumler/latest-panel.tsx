"use client";

import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Gauge, Pencil, Check, X } from "lucide-react";
import { saveComponentLatest, type SaveState } from "@/lib/versions/actions";
import { BentoCard } from "@/components/bento-card";
import { Input } from "@/components/ui/input";
import type { ComponentLatest } from "@/lib/versions/types";

function RefChip({ component }: { component: ComponentLatest }) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const save = saveComponentLatest.bind(null, component.key);
  const [state, action, pending] = useActionState<SaveState, FormData>(
    save,
    null,
  );
  useEffect(() => {
    if (state && "ok" in state && state.ok) {
      setEditing(false);
      router.refresh();
    }
  }, [state, router]);

  if (editing) {
    return (
      <form
        action={action}
        className="flex items-center gap-1.5 rounded-xl bg-muted/60 py-1 pr-1 pl-3"
      >
        <span className="text-xs text-muted-foreground">{component.label}</span>
        <Input
          name="latest_version"
          defaultValue={component.latest_version ?? ""}
          autoFocus
          className="h-7 w-28 font-mono"
        />
        <button
          type="submit"
          disabled={pending}
          aria-label="Kaydet"
          className="press grid size-7 place-items-center rounded-lg text-primary transition-colors hover:bg-card disabled:opacity-50"
        >
          <Check className="size-4" />
        </button>
        <button
          type="button"
          onClick={() => setEditing(false)}
          aria-label="İptal"
          className="press grid size-7 place-items-center rounded-lg text-muted-foreground transition-colors hover:bg-card hover:text-foreground"
        >
          <X className="size-4" />
        </button>
      </form>
    );
  }

  return (
    <div className="group flex items-center gap-2 rounded-xl bg-muted/50 py-1.5 pr-1.5 pl-3 ring-1 ring-foreground/[0.04]">
      <span className="text-xs text-muted-foreground">{component.label}</span>
      <span className="font-mono text-sm font-medium tabular-nums">
        {component.latest_version ?? "-"}
      </span>
      <button
        type="button"
        onClick={() => setEditing(true)}
        aria-label={`${component.label} güncel sürümü düzenle`}
        className="press grid size-6 place-items-center rounded-md text-muted-foreground/50 transition-colors group-hover:text-muted-foreground hover:bg-card hover:text-foreground"
      >
        <Pencil className="size-3.5" />
      </button>
    </div>
  );
}

export function LatestPanel({ components }: { components: ComponentLatest[] }) {
  return (
    <BentoCard
      title="Güncel sürüm referansı"
      icon={Gauge}
      bodyClassName="flex flex-wrap gap-2"
    >
      {components.map((c) => (
        <RefChip key={c.key} component={c} />
      ))}
    </BentoCard>
  );
}
