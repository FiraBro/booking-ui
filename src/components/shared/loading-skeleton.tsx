import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

interface BaseProps {
  className?: string;
}

function Busy({
  children,
  className,
  label = "Loading…",
}: {
  children: React.ReactNode;
  className?: string;
  label?: string;
}) {
  return (
    <div aria-busy="true" className={className}>
      <span role="status" className="sr-only">
        {label}
      </span>
      {children}
    </div>
  );
}

export function StatGridSkeleton({
  count = 4,
  className,
}: BaseProps & { count?: number }) {
  return (
    <Busy className={cn("grid gap-4 sm:grid-cols-2 xl:grid-cols-4", className)}>
      {Array.from({ length: count }, (_, index) => (
        <div key={index} className="space-y-3 rounded-lg border bg-card p-5">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-3 w-20" />
        </div>
      ))}
    </Busy>
  );
}

export function CardGridSkeleton({
  count = 6,
  className,
}: BaseProps & { count?: number }) {
  return (
    <Busy className={cn("grid gap-4 sm:grid-cols-2 lg:grid-cols-3", className)}>
      {Array.from({ length: count }, (_, index) => (
        <div key={index} className="overflow-hidden rounded-lg border bg-card">
          <Skeleton className="h-36 w-full rounded-none" />
          <div className="space-y-2 p-4">
            <Skeleton className="h-5 w-3/4" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-1/2" />
          </div>
        </div>
      ))}
    </Busy>
  );
}

export function ListSkeleton({
  rows = 5,
  className,
}: BaseProps & { rows?: number }) {
  return (
    <Busy className={cn("space-y-3", className)}>
      {Array.from({ length: rows }, (_, index) => (
        <div
          key={index}
          className="flex items-center gap-3 rounded-lg border bg-card p-4"
        >
          <Skeleton className="size-10 shrink-0 rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-2/5" />
            <Skeleton className="h-3 w-3/5" />
          </div>
          <Skeleton className="h-6 w-16" />
        </div>
      ))}
    </Busy>
  );
}

export function FormSkeleton({
  fields = 4,
  className,
}: BaseProps & { fields?: number }) {
  return (
    <Busy className={cn("space-y-4", className)}>
      {Array.from({ length: fields }, (_, index) => (
        <div key={index} className="space-y-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-9 w-full" />
        </div>
      ))}
      <Skeleton className="h-9 w-28" />
    </Busy>
  );
}

export function TableSkeleton({
  rows = 6,
  columns = 5,
  className,
}: BaseProps & { rows?: number; columns?: number }) {
  return (
    <Busy className={cn("space-y-3 rounded-lg border bg-card p-4", className)}>
      <Skeleton className="h-8 w-full" />
      {Array.from({ length: rows }, (_, row) => (
        <div key={row} className="flex gap-4">
          {Array.from({ length: columns }, (_, column) => (
            <Skeleton key={column} className="h-6 flex-1" />
          ))}
        </div>
      ))}
    </Busy>
  );
}

export function PageSkeleton({ className }: BaseProps) {
  return (
    <Busy className={cn("space-y-6", className)}>
      <div className="space-y-2">
        <Skeleton className="h-8 w-56" />
        <Skeleton className="h-4 w-80 max-w-full" />
      </div>
      <StatGridSkeleton />
      <TableSkeleton />
    </Busy>
  );
}

type SkeletonVariant = "stats" | "cards" | "list" | "form" | "table" | "page";

export function LoadingSkeleton({
  variant = "list",
  className,
}: BaseProps & { variant?: SkeletonVariant }) {
  switch (variant) {
    case "stats":
      return <StatGridSkeleton className={className} />;
    case "cards":
      return <CardGridSkeleton className={className} />;
    case "form":
      return <FormSkeleton className={className} />;
    case "table":
      return <TableSkeleton className={className} />;
    case "page":
      return <PageSkeleton className={className} />;
    default:
      return <ListSkeleton className={className} />;
  }
}
