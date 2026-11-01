import { TrendingDown, TrendingUp, type LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

interface StatCardProps {
  title: string;
  value: ReactNode;
  icon?: LucideIcon;
  description?: ReactNode;
  /** Percentage change versus the previous period. Positive is shown as an improvement. */
  trend?: { value: number; label?: string };
  loading?: boolean;
  className?: string;
}

export function StatCard({
  title,
  value,
  icon: Icon,
  description,
  trend,
  loading,
  className,
}: StatCardProps) {
  const positive = (trend?.value ?? 0) >= 0;
  const TrendIcon = positive ? TrendingUp : TrendingDown;

  return (
    <Card className={cn("py-0", className)}>
      <CardContent className="space-y-2 p-5">
        <div className="flex items-center justify-between gap-2">
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          {Icon ? (
            <span className="flex size-8 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
              <Icon className="size-4" aria-hidden />
            </span>
          ) : null}
        </div>

        {loading ? (
          <div aria-busy="true" className="space-y-2">
            <span role="status" className="sr-only">
              Loading {title}
            </span>
            <Skeleton className="h-8 w-28" />
            <Skeleton className="h-3 w-20" />
          </div>
        ) : (
          <>
            <p className="tabular text-2xl font-semibold tracking-tight">
              {value}
            </p>
            {trend || description ? (
              <p className="flex flex-wrap items-center gap-x-2 text-xs text-muted-foreground">
                {trend ? (
                  <span
                    className={cn(
                      "inline-flex items-center gap-1 font-medium",
                      positive ? "text-success" : "text-destructive",
                    )}
                  >
                    <TrendIcon className="size-3.5" aria-hidden />
                    {positive ? "+" : ""}
                    {trend.value.toFixed(1)}%
                    <span className="sr-only">
                      {positive ? "increase" : "decrease"}
                    </span>
                  </span>
                ) : null}
                {trend?.label ? <span>{trend.label}</span> : null}
                {description ? <span>{description}</span> : null}
              </p>
            ) : null}
          </>
        )}
      </CardContent>
    </Card>
  );
}
