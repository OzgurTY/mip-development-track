import { cn } from "@/lib/utils";

const PAIRS: [string, string][] = [
  ["var(--accent-indigo)", "var(--accent-violet)"],
  ["var(--accent-emerald)", "var(--accent-sky)"],
  ["var(--accent-amber)", "var(--accent-rose)"],
  ["var(--accent-sky)", "var(--accent-indigo)"],
  ["var(--accent-rose)", "var(--accent-violet)"],
  ["var(--accent-violet)", "var(--accent-indigo)"],
];

function hash(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h;
}

function initialsOf(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}

export function Avatar({
  name,
  className,
}: {
  name: string;
  className?: string;
}) {
  const [a, b] = PAIRS[hash(name) % PAIRS.length];
  return (
    <span
      aria-hidden
      className={cn(
        "grid shrink-0 place-items-center rounded-xl font-semibold text-white",
        className,
      )}
      style={{ backgroundImage: `linear-gradient(135deg, ${a}, ${b})` }}
    >
      {initialsOf(name)}
    </span>
  );
}
