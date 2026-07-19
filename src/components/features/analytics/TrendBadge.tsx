import { cn } from "@/lib/utils";

type Trend = "up" | "down" | "neutral";

interface TrendBadgeProps {
  value: string;
  trend?: Trend;
}

const trendClassNames: Record<Trend, string> = {
  up: "text-emerald-300",
  down: "text-destructive",
  neutral: "text-muted-foreground",
};

export function TrendBadge({ value, trend = "neutral" }: TrendBadgeProps) {
  return (
    <span
      className={cn(
        "font-mono text-[11px] font-medium tabular-nums",
        trendClassNames[trend],
      )}
    >
      {value}
    </span>
  );
}
