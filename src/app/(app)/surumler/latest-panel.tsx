"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { saveComponentLatest, type SaveState } from "@/lib/versions/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { ComponentLatest } from "@/lib/versions/types";

function LatestRow({ component }: { component: ComponentLatest }) {
  const router = useRouter();
  const save = saveComponentLatest.bind(null, component.key);
  const [state, action, pending] = useActionState<SaveState, FormData>(
    save,
    null,
  );
  useEffect(() => {
    if (state && "ok" in state && state.ok) router.refresh();
  }, [state, router]);

  return (
    <form action={action} className="flex items-end gap-2">
      <div className="space-y-1">
        <Label
          htmlFor={`lv_${component.key}`}
          className="text-xs text-muted-foreground"
        >
          {component.label}
        </Label>
        <Input
          id={`lv_${component.key}`}
          name="latest_version"
          defaultValue={component.latest_version ?? ""}
          className="w-40"
        />
      </div>
      <Button type="submit" size="sm" variant="outline" disabled={pending}>
        Kaydet
      </Button>
    </form>
  );
}

export function LatestPanel({ components }: { components: ComponentLatest[] }) {
  return (
    <section className="space-y-3 rounded-lg border bg-muted/30 p-4">
      <h2 className="text-sm font-semibold">Güncel sürüm referansı</h2>
      <div className="flex flex-wrap gap-4">
        {components.map((c) => (
          <LatestRow key={c.key} component={c} />
        ))}
      </div>
    </section>
  );
}
