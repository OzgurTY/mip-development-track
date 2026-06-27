import type { TrackUpdate } from "@/lib/track/types";

export function UpdateList({ updates }: { updates: TrackUpdate[] }) {
  if (updates.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">Henüz güncelleme yok.</p>
    );
  }
  return (
    <ul className="space-y-2.5">
      {updates.map((u) => (
        <li key={u.id} className="relative border-l-2 border-border pl-3.5">
          <span className="absolute top-1.5 -left-[5px] size-2 rounded-full bg-primary" />
          <p className="text-xs tabular-nums text-muted-foreground">
            {u.week_date}
          </p>
          <p className="text-sm whitespace-pre-wrap">{u.body}</p>
        </li>
      ))}
    </ul>
  );
}
