import { Download } from "lucide-react";
import type { ReactNode } from "react";
import { EmptyState } from "@/components/shared/empty-state";
import { ErrorState } from "@/components/shared/error-state";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

interface ChartCardProps {
  children?: ReactNode;
  title?: string;
  description?: string;
  isLoading?: boolean;
  error?: Error | null;
  onRetry?: () => void;
  isEmpty?: boolean;
  onExport?: () => void;
}

export function ChartCard({
  children,
  title,
  description,
  isLoading,
  error,
  onRetry,
  isEmpty,
  onExport,
}: ChartCardProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-4">
        <div className="space-y-1">
          {title ? <CardTitle>{title}</CardTitle> : null}
          {description ? <CardDescription>{description}</CardDescription> : null}
        </div>
        {onExport ? (
          <Button
            variant="outline"
            size="icon"
            aria-label={`Export ${title ?? "report"} as CSV`}
            onClick={onExport}
          >
            <Download aria-hidden />
          </Button>
        ) : null}
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <Skeleton className="h-64 w-full" />
        ) : error ? (
          <ErrorState error={error} onRetry={onRetry} />
        ) : isEmpty ? (
          <EmptyState
            title="No report data"
            description="There is no data for the selected date range."
          />
        ) : (
          children
        )}
      </CardContent>
    </Card>
  );
}
