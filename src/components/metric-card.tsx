import { Card, CardContent } from "@/components/ui/card";

type Props = {
  label: string;
  value: number | string;
  hint?: string;
};

export function MetricCard({ label, value, hint }: Props) {
  return (
    <Card size="sm">
      <CardContent className="space-y-1">
        <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
          {label}
        </p>
        <p className="text-3xl font-semibold tabular-nums">{value}</p>
        {hint ? <p className="text-xs text-muted-foreground">{hint}</p> : null}
      </CardContent>
    </Card>
  );
}
