"use client";

import {
  Bar,
  BarChart,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

export type Slice = { name: string; value: number; color: string };

type TooltipPayload = {
  name?: string;
  value?: number | string;
  payload?: { color?: string; fill?: string };
};

function ChartTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: TooltipPayload[];
  label?: string;
}) {
  if (!active || !payload || payload.length === 0) return null;
  return (
    <div className="rounded-xl bg-popover px-3 py-2 text-xs shadow-[var(--shadow-lift)] ring-1 ring-foreground/10">
      {label ? <p className="mb-1 font-medium">{label}</p> : null}
      <div className="space-y-0.5">
        {payload.map((p, i) => (
          <div key={i} className="flex items-center gap-2">
            <span
              className="size-2 rounded-full"
              style={{ background: p.payload?.fill ?? p.payload?.color }}
            />
            <span className="text-muted-foreground">{p.name}</span>
            <span className="ml-auto font-semibold tabular-nums">{p.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function StatusDonut({
  data,
  total,
}: {
  data: Slice[];
  total: number;
}) {
  const nonEmpty = data.filter((d) => d.value > 0);
  return (
    <div className="relative h-[200px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Tooltip content={<ChartTooltip />} cursor={false} />
          <Pie
            data={nonEmpty}
            dataKey="value"
            nameKey="name"
            innerRadius={62}
            outerRadius={92}
            paddingAngle={nonEmpty.length > 1 ? 3 : 0}
            cornerRadius={8}
            stroke="none"
            startAngle={90}
            endAngle={-270}
          >
            {nonEmpty.map((d) => (
              <Cell key={d.name} fill={d.color} />
            ))}
          </Pie>
        </PieChart>
      </ResponsiveContainer>
      <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-display text-3xl font-bold tabular-nums">
          {total}
        </span>
        <span className="text-xs text-muted-foreground">müşteri</span>
      </div>
    </div>
  );
}

export type ComponentBarRow = {
  label: string;
  current: number;
  behind: number;
  unknown: number;
};

export function ComponentBars({ data }: { data: ComponentBarRow[] }) {
  return (
    <div className="w-full" style={{ height: data.length * 34 + 16 }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          layout="vertical"
          margin={{ top: 0, right: 8, bottom: 0, left: 0 }}
          barCategoryGap={8}
        >
          <XAxis type="number" hide />
          <YAxis
            type="category"
            dataKey="label"
            width={104}
            tickLine={false}
            axisLine={false}
            tick={{ fontSize: 12, fill: "var(--muted-foreground)" }}
          />
          <Tooltip content={<ChartTooltip />} cursor={{ fill: "var(--muted)" }} />
          <Bar
            dataKey="current"
            stackId="a"
            name="Güncel"
            fill="var(--accent-emerald)"
            radius={[6, 0, 0, 6]}
          />
          <Bar
            dataKey="behind"
            stackId="a"
            name="Geride"
            fill="var(--accent-rose)"
          />
          <Bar
            dataKey="unknown"
            stackId="a"
            name="Kurulu değil"
            fill="var(--muted)"
            radius={[0, 6, 6, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
