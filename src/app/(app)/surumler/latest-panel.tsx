"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Gauge } from "lucide-react";
import { saveComponentLatest, type SaveState } from "@/lib/versions/actions";
import { BentoCard } from "@/components/bento-card";
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
          className="w-36 font-mono"
        />
      </div>
      <Button
        type="submit"
        size="sm"
        variant="outline"
        className="press"
        disabled={pending}
      >
        Kaydet
      </Button>
    </form>
  );
}

export function LatestPanel({ components }: { components: ComponentLatest[] }) {
  return (
    <BentoCard title="Güncel sürüm referansı" icon={Gauge}>
      <div className="flex flex-wrap gap-x-5 gap-y-3">
        {components.map((c) => (
          <LatestRow key={c.key} component={c} />
        ))}
      </div>
    </BentoCard>
  );
}
