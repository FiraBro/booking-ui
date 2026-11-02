"use client";

import { ErrorState } from "@/components/shared/error-state";
import { CardGridSkeleton } from "@/components/shared/loading-skeleton";
import { ServiceCard } from "@/features/services/components/service-card";
import { useServices } from "@/features/services/hooks/use-services";

export function FeaturedServices() {
  const query = useServices({ isActive: true, page: 1, pageSize: 3 });
  const items = query.data?.items ?? [];

  if (query.isPending) return <CardGridSkeleton count={3} />;
  if (query.isError && !query.data)
    return (
      <ErrorState error={query.error} onRetry={() => void query.refetch()} />
    );
  if (items.length === 0) {
    return (
      <p className="text-center text-sm text-muted-foreground">
        Services will appear here soon.
      </p>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {items.map((service) => (
        <ServiceCard key={service.id} service={service} />
      ))}
    </div>
  );
}
