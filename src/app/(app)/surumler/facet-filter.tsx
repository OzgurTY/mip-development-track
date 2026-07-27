"use client";

import { useEffect, useRef, useState } from "react";
import { Check, ChevronDown } from "lucide-react";

export type FacetOption = {
  value: string;
  count: number;
};

type Props = {
  label: string;
  options: FacetOption[];
  selected: string[];
  onToggle: (value: string) => void;
  onClear: () => void;
};

/**
 * Çoklu seçimli filtre dropdown'u. Panel dışına tıklanınca veya Escape ile
 * kapanır; seçim yapmak paneli kapatmaz ki arka arkaya işaretlenebilsin.
 */
export function FacetFilter({
  label,
  options,
  selected,
  onToggle,
  onClear,
}: Props) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

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

  const active = selected.length > 0;

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className={
          active
            ? "press inline-flex items-center gap-1.5 rounded-full bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground"
            : "press inline-flex items-center gap-1.5 rounded-full bg-card px-3 py-1.5 text-sm text-muted-foreground ring-1 ring-foreground/[0.06] transition-colors hover:text-foreground"
        }
      >
        {label}
        {active ? (
          <span className="grid size-5 place-items-center rounded-full bg-primary-foreground/20 text-xs font-semibold tabular-nums">
            {selected.length}
          </span>
        ) : null}
        <ChevronDown
          className={
            open ? "size-3.5 rotate-180 transition-transform" : "size-3.5 transition-transform"
          }
        />
      </button>

      {open ? (
        <div className="absolute top-full left-0 z-30 mt-1.5 min-w-48 rounded-xl bg-card p-1.5 shadow-lg ring-1 ring-foreground/[0.08]">
          {options.map((o) => {
            const checked = selected.includes(o.value);
            return (
              <button
                key={o.value}
                type="button"
                onClick={() => onToggle(o.value)}
                className="press flex w-full items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-left text-sm transition-colors hover:bg-accent"
              >
                <span
                  className={
                    checked
                      ? "grid size-4 shrink-0 place-items-center rounded border border-primary bg-primary text-primary-foreground"
                      : "grid size-4 shrink-0 place-items-center rounded border border-foreground/20"
                  }
                >
                  {checked ? <Check className="size-3" /> : null}
                </span>
                <span className="flex-1 truncate">{o.value}</span>
                <span className="text-xs text-muted-foreground tabular-nums">
                  {o.count}
                </span>
              </button>
            );
          })}
          {active ? (
            <button
              type="button"
              onClick={onClear}
              className="press mt-1 w-full rounded-lg border-t border-border/60 px-2.5 py-1.5 text-left text-xs text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
            >
              Seçimi temizle
            </button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
