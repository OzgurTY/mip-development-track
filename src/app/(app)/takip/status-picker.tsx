"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, ChevronDown } from "lucide-react";
import { toast } from "sonner";
import { setTrackStatus } from "@/lib/track/actions";
import { StatusBadge } from "@/components/status-badge";
import { TRACK_STATUSES } from "@/lib/track/types";

type Props = {
  customerId: string;
  name: string;
  status: string | null;
};

export function StatusPicker({ customerId, name, status }: Props) {
  const router = useRouter();
  const rootRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    if (!open) return;
    function onPointerDown(e: PointerEvent) {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    }
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  function choose(next: string) {
    setOpen(false);
    if (next === status) return;
    startTransition(async () => {
      const result = await setTrackStatus(customerId, next);
      if (result.error) {
        toast.error(result.error);
        return;
      }
      router.refresh();
    });
  }

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        disabled={pending}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={`${name} durumunu değiştir`}
        className="press inline-flex items-center gap-1 rounded-full focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none disabled:opacity-50"
      >
        {status ? (
          <StatusBadge status={status} />
        ) : (
          <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium text-muted-foreground ring-1 ring-border ring-inset">
            Durum seç
          </span>
        )}
        <ChevronDown className="size-3.5 text-muted-foreground" />
      </button>

      {open ? (
        <div
          role="listbox"
          aria-label="Durum seçenekleri"
          className="absolute top-full left-0 z-20 mt-1.5 w-40 rounded-xl border border-border bg-card p-1 shadow-lg"
        >
          {TRACK_STATUSES.map((s) => (
            <button
              key={s}
              type="button"
              role="option"
              aria-selected={s === status}
              onClick={() => choose(s)}
              className="flex w-full items-center justify-between rounded-lg px-2 py-1.5 transition-colors hover:bg-muted focus-visible:bg-muted focus-visible:outline-none"
            >
              <StatusBadge status={s} />
              {s === status ? (
                <Check className="size-3.5 text-muted-foreground" />
              ) : null}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
