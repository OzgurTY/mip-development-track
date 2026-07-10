"use client";

import { useRef, useState } from "react";
import { CalendarDays } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

// Tarayıcının yerleşik date input'u görünümü tarayıcı diline göre
// biçimlendirir (sayfa lang'ı etkisiz). Bu bileşen her zaman gg/aa/yyyy
// gösterir; form'a gizli input ile ISO (yyyy-aa-gg) değer gönderir.

function isoToDisplay(iso: string): string {
  const [y, m, d] = iso.split("-");
  if (!y || !m || !d) return "";
  return `${d}/${m}/${y}`;
}

function displayToIso(value: string): string {
  const match = value.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (!match) return "";
  const [, d, m, y] = match;
  const date = new Date(Number(y), Number(m) - 1, Number(d));
  const isReal =
    date.getFullYear() === Number(y) &&
    date.getMonth() === Number(m) - 1 &&
    date.getDate() === Number(d);
  return isReal ? `${y}-${m}-${d}` : "";
}

function formatTyping(raw: string): string {
  const digits = raw.replace(/\D/g, "").slice(0, 8);
  const parts = [digits.slice(0, 2), digits.slice(2, 4), digits.slice(4, 8)];
  return parts.filter(Boolean).join("/");
}

type Props = {
  name: string;
  /** ISO biçiminde (yyyy-aa-gg) başlangıç değeri */
  defaultValue?: string;
  className?: string;
  "aria-label"?: string;
};

export function DateInputTr({
  name,
  defaultValue = "",
  className,
  "aria-label": ariaLabel,
}: Props) {
  const [display, setDisplay] = useState(() => isoToDisplay(defaultValue));
  const pickerRef = useRef<HTMLInputElement>(null);
  const iso = displayToIso(display);

  function openPicker() {
    const el = pickerRef.current;
    if (!el) return;
    el.value = iso;
    try {
      el.showPicker();
    } catch {
      // showPicker desteklenmiyorsa elle yazım tek yol olarak kalır
    }
  }

  return (
    <div className={cn("relative", className)}>
      <Input
        inputMode="numeric"
        placeholder="gg/aa/yyyy"
        value={display}
        onChange={(e) => setDisplay(formatTyping(e.target.value))}
        aria-label={ariaLabel}
        className="pr-9"
      />
      <input type="hidden" name={name} value={iso} />
      <input
        ref={pickerRef}
        type="date"
        tabIndex={-1}
        aria-hidden="true"
        onChange={(e) => setDisplay(isoToDisplay(e.target.value))}
        className="pointer-events-none absolute right-2 bottom-0 size-px opacity-0"
      />
      <button
        type="button"
        onClick={openPicker}
        aria-label="Takvimden tarih seç"
        className="press absolute top-1/2 right-1.5 grid size-7 -translate-y-1/2 place-items-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
      >
        <CalendarDays className="size-4" />
      </button>
    </div>
  );
}
