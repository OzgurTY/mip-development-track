import { compareVersion, type DriftStatus } from "@/lib/versions/drift";
import type { ComponentLatest, MatrixRow } from "@/lib/versions/types";
import type { BoardRow } from "@/lib/track/types";

export type InstallDrift = {
  customerId: string;
  customerName: string;
  system: string | null;
  behind: number;
  components: { label: string; installed: string; status: DriftStatus }[];
};

export function rowDrift(
  row: MatrixRow,
  components: ComponentLatest[],
): InstallDrift {
  const comps = components.map((c) => {
    const installed = String(row.custom_fields?.[c.key] ?? "");
    return {
      label: c.label,
      installed,
      status: compareVersion(installed, c.latest_version, c.kind),
    };
  });
  return {
    customerId: row.customer_id,
    customerName: row.customerName,
    system: row.system,
    behind: comps.filter((c) => c.status === "behind").length,
    components: comps,
  };
}

export function rankMostBehind(
  matrix: MatrixRow[],
  components: ComponentLatest[],
  limit = 6,
): InstallDrift[] {
  return matrix
    .map((r) => rowDrift(r, components))
    .filter((d) => d.behind > 0)
    .sort(
      (a, b) =>
        b.behind - a.behind ||
        a.customerName.localeCompare(b.customerName, "tr"),
    )
    .slice(0, limit);
}

export type StatusCounts = {
  total: number;
  active: number;
  byStatus: Record<string, number>;
};

export function statusCounts(board: BoardRow[]): StatusCounts {
  const byStatus: Record<string, number> = {};
  let active = 0;
  for (const r of board) {
    const s = r.record?.status ?? "Durum yok";
    byStatus[s] = (byStatus[s] ?? 0) + 1;
    if (s === "Aktif") active++;
  }
  return { total: board.length, active, byStatus };
}

export type AttentionItem = {
  customerId: string;
  customerName: string;
  reason: string;
};

const ATTENTION_STATUS = new Set(["Beklemede", "İnaktif"]);

export function pickAttention(
  board: BoardRow[],
  matrix: MatrixRow[],
  components: ComponentLatest[],
  limit = 8,
): AttentionItem[] {
  const behindByCustomer = new Map<string, number>();
  for (const r of matrix) {
    const d = rowDrift(r, components);
    behindByCustomer.set(
      r.customer_id,
      (behindByCustomer.get(r.customer_id) ?? 0) + d.behind,
    );
  }

  const items: (AttentionItem & { behind: number })[] = [];
  for (const row of board) {
    const status = row.record?.status ?? null;
    const behind = behindByCustomer.get(row.customerId) ?? 0;
    const reasons: string[] = [];
    if (status && ATTENTION_STATUS.has(status)) reasons.push(status);
    if (behind > 0) reasons.push(`${behind} bileşen geride`);
    if (reasons.length === 0) continue;
    items.push({
      customerId: row.customerId,
      customerName: row.name,
      reason: reasons.join(" · "),
      behind,
    });
  }

  return items
    .sort(
      (a, b) =>
        b.behind - a.behind ||
        a.customerName.localeCompare(b.customerName, "tr"),
    )
    .slice(0, limit)
    .map(({ customerId, customerName, reason }) => ({
      customerId,
      customerName,
      reason,
    }));
}
