import { createClient } from "@/lib/supabase/server";
import { getTrackBoard } from "@/lib/track/queries";
import { getComponentLatest, getVersionMatrix } from "@/lib/versions/queries";
import {
  componentBreakdown,
  pickAttention,
  rankMostBehind,
  statusCounts,
  type AttentionItem,
  type ComponentBreakdown,
  type InstallDrift,
  type StatusCounts,
} from "./compute";

export type RecentUpdate = {
  id: string;
  weekDate: string;
  body: string;
  customerName: string;
  author: string | null;
};

type RawRecent = {
  id: string;
  week_date: string;
  body: string;
  customer: { name: string } | null;
  author: { full_name: string | null } | null;
};

export async function getRecentUpdates(limit = 8): Promise<RecentUpdate[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("track_updates")
    .select(
      "id, week_date, body, customer:customers(name), author:profiles(full_name)",
    )
    .order("week_date", { ascending: false })
    .limit(limit);
  return ((data ?? []) as unknown as RawRecent[]).map((u) => ({
    id: u.id,
    weekDate: u.week_date,
    body: u.body,
    customerName: u.customer?.name ?? "?",
    author: u.author?.full_name ?? null,
  }));
}

export type Overview = {
  counts: StatusCounts;
  mostBehind: InstallDrift[];
  attention: AttentionItem[];
  recent: RecentUpdate[];
  components: ComponentBreakdown[];
  versionCount: number;
};

export async function getOverview(): Promise<Overview> {
  const [board, matrix, components, recent] = await Promise.all([
    getTrackBoard(),
    getVersionMatrix(),
    getComponentLatest(),
    getRecentUpdates(8),
  ]);
  return {
    counts: statusCounts(board),
    mostBehind: rankMostBehind(matrix, components, 6),
    attention: pickAttention(board, matrix, components, 8),
    recent,
    components: componentBreakdown(matrix, components),
    versionCount: matrix.length,
  };
}
