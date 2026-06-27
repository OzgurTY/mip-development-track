export type DriftStatus = "current" | "behind" | "ahead" | "unknown";

const NONE = new Set(["", "yok", "-", "n/a", "na", "none", "."]);

export function extractSemver(s: string): number[] | null {
  const m = s.match(/(\d+)(?:\.(\d+))?(?:\.(\d+))?/);
  if (!m) return null;
  return [Number(m[1]), Number(m[2] ?? 0), Number(m[3] ?? 0)];
}

function cmp(a: number[], b: number[]): number {
  for (let i = 0; i < 3; i++) {
    const d = (a[i] ?? 0) - (b[i] ?? 0);
    if (d !== 0) return d;
  }
  return 0;
}

export function compareVersion(
  installed: string | null | undefined,
  latest: string | null | undefined,
  kind: "semver" | "date",
): DriftStatus {
  const inst = (installed ?? "").trim();
  if (!inst || NONE.has(inst.toLowerCase())) return "unknown";
  const lat = (latest ?? "").trim();
  if (!lat) return "unknown";

  if (kind === "date") {
    const di = Date.parse(inst);
    const dl = Date.parse(lat);
    if (Number.isNaN(di) || Number.isNaN(dl)) return "unknown";
    return di >= dl ? "current" : "behind";
  }

  const vi = extractSemver(inst);
  const vl = extractSemver(lat);
  if (!vi || !vl) return "unknown";
  const c = cmp(vi, vl);
  if (c === 0) return "current";
  return c < 0 ? "behind" : "ahead";
}
