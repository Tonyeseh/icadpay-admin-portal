import type { ReactNode } from "react";
import { ArrowDownRightIcon, ArrowUpRightIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export function KpiCard({
  label,
  value,
  delta,
  icon,
  hint,
  invertDelta,
  className,
}: {
  label: string;
  value: string;
  delta?: number;
  icon?: ReactNode;
  hint?: string;
  invertDelta?: boolean;
  className?: string;
}) {
  const rawPositive = (delta ?? 0) >= 0;
  const positive = invertDelta ? !rawPositive : rawPositive;

  return (
    <Card size="sm" className={cn("relative", className)}>
      <CardContent className="flex flex-col gap-2.5">
        <div className="flex items-start justify-between">
          <span className="text-xs font-medium text-muted-foreground">{label}</span>
          {icon && (
            <span className="grid size-7 place-items-center rounded-md bg-primary/10 text-primary">
              {icon}
            </span>
          )}
        </div>
        <div className="text-2xl font-semibold leading-none tracking-tight tabular-nums md:text-[28px]">
          {value}
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          {typeof delta === "number" && (
            <span
              className={cn(
                "inline-flex items-center gap-0.5 rounded-md px-1.5 py-0.5 text-[11px] font-semibold",
                positive ? "bg-success/10 text-success" : "bg-destructive/10 text-destructive",
              )}
            >
              {positive ? <ArrowUpRightIcon className="size-3" /> : <ArrowDownRightIcon className="size-3" />}
              {Math.abs(delta).toFixed(1)}%
            </span>
          )}
          {hint && <span>{hint}</span>}
        </div>
      </CardContent>
    </Card>
  );
}
