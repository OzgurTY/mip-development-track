import { MONTHS_TR, fromIso } from "./date";

export type AgendaItem = { start: string };

export type AgendaGroup<T extends AgendaItem> = {
  key: string;
  label: string;
  items: T[];
};

/**
 * Ajanda gorunumu: aya gore gruplanmis, tarihe gore artan liste.
 * Gruplar da kronolojik sirada doner.
 */
export function groupByMonth<T extends AgendaItem>(items: T[]): AgendaGroup<T>[] {
  const buckets = new Map<string, T[]>();

  for (const item of [...items].sort((a, b) => a.start.localeCompare(b.start))) {
    const key = item.start.slice(0, 7);
    const bucket = buckets.get(key);
    if (bucket) bucket.push(item);
    else buckets.set(key, [item]);
  }

  return [...buckets.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, groupItems]) => {
      const date = fromIso(`${key}-01`);
      return {
        key,
        label: `${MONTHS_TR[date.getUTCMonth()]} ${date.getUTCFullYear()}`,
        items: groupItems,
      };
    });
}
