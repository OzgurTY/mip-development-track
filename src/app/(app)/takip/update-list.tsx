"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { UpdateItem } from "./update-item";
import type { TrackUpdate } from "@/lib/track/types";

const TR_MONTHS = [
  "Oca",
  "Şub",
  "Mar",
  "Nis",
  "May",
  "Haz",
  "Tem",
  "Ağu",
  "Eyl",
  "Eki",
  "Kas",
  "Ara",
];

function formatWeek(iso: string): string {
  const [y, m, d] = iso.split("-");
  const mi = Number(m) - 1;
  if (!y || Number.isNaN(mi) || !TR_MONTHS[mi]) return iso;
  return `${Number(d)} ${TR_MONTHS[mi]} ${y}`;
}

const DEFAULT_COUNT = 5;

export function UpdateList({
  updates,
  initialCount = DEFAULT_COUNT,
  canEdit = false,
}: {
  updates: TrackUpdate[];
  initialCount?: number;
  canEdit?: boolean;
}) {
  const [expanded, setExpanded] = useState(false);

  if (updates.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">Henüz güncelleme yok.</p>
    );
  }

  const visible = expanded ? updates : updates.slice(0, initialCount);
  const hidden = updates.length - initialCount;

  return (
    <div className="space-y-3">
      <ol className="relative ml-1 space-y-3.5 border-l border-border pl-5">
        {visible.map((u) => (
          <li key={u.id} className="relative">
            <span className="absolute top-1 -left-[1.55rem] size-2.5 rounded-full bg-primary ring-4 ring-card" />
            <UpdateItem
              update={u}
              weekLabel={formatWeek(u.week_date)}
              canEdit={canEdit}
            />
          </li>
        ))}
      </ol>

      {hidden > 0 ? (
        <button
          type="button"
          onClick={() => setExpanded((e) => !e)}
          className="press inline-flex items-center gap-1 rounded-lg px-1 text-sm font-medium text-primary transition-colors hover:underline"
        >
          {expanded ? (
            <>
              <ChevronUp className="size-4" />
              Daha az göster
            </>
          ) : (
            <>
              <ChevronDown className="size-4" />
              {hidden} güncelleme daha göster
            </>
          )}
        </button>
      ) : null}
    </div>
  );
}
