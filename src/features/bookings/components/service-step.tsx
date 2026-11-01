"use client";

import { Clock } from "lucide-react";
import { useState } from "react";
import { EmptyState } from "@/components/shared/empty-state";
import { ErrorState } from "@/components/shared/error-state";
import { CardGridSkeleton } from "@/components/shared/loading-skeleton";
import { SearchInput } from "@/components/shared/search-input";
import { Button } from "@/components/ui/button";
import { useServiceCategories } from "@/features/services/hooks/use-service-categories";
import { useServices } from "@/features/services/hooks/use-services";
import { formatCurrency, formatDuration } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { Service } from "@/types";

interface ServiceStepProps {
  selectedId?: string;
  onSelect: (service: Service) => void;
}

export function ServiceStep({ selectedId, onSelect }: ServiceStepProps) {
  const [search, setSearch] = useState("");
  const [categoryId, setCategoryId] = useState("all");
  const categories = useServiceCategories();
  const services = useServices({
    search,
    categoryId,
    isActive: true,
    page: 1,
    pageSize: 50,
  });

  const items = services.data?.items ?? [];

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Search services"
          aria-label="Search services"
        />
        {categories.data && categories.data.length > 0 ? (
          <div
            role="group"
            aria-label="Filter by category"
            className="flex flex-wrap gap-2"
          >
            <Button
              type="button"
              size="sm"
              variant={categoryId === "all" ? "default" : "outline"}
              aria-pressed={categoryId === "all"}
              onClick={() => setCategoryId("all")}
            >
              All
            </Button>
            {categories.data.map((category) => (
              <Button
                key={category.id}
                type="button"
                size="sm"
                variant={categoryId === category.id ? "default" : "outline"}
                aria-pressed={categoryId === category.id}
                onClick={() => setCategoryId(category.id)}
              >
                {category.name}
              </Button>
            ))}
          </div>
        ) : null}
      </div>

      {services.isPending ? (
        <CardGridSkeleton count={4} className="lg:grid-cols-2" />
      ) : services.isError && !services.data ? (
        <ErrorState
          error={services.error}
          onRetry={() => void services.refetch()}
        />
      ) : items.length === 0 ? (
        <EmptyState
          title="No services found"
          description="Try a different search or category."
        />
      ) : (
        <div
          role="group"
          aria-label="Services"
          className="grid gap-3 sm:grid-cols-2"
        >
          {items.map((service) => {
            const selected = service.id === selectedId;
            return (
              <button
                key={service.id}
                type="button"
                aria-pressed={selected}
                onClick={() => onSelect(service)}
                className={cn(
                  "flex flex-col gap-2 rounded-lg border bg-card p-4 text-left transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                  selected &&
                    "border-primary bg-primary/5 ring-2 ring-primary/30",
                )}
              >
                <span className="flex items-start justify-between gap-2">
                  <span className="font-medium">{service.name}</span>
                  <span className="tabular shrink-0 text-sm font-semibold">
                    {formatCurrency(service.price, service.currency)}
                  </span>
                </span>
                {service.description ? (
                  <span className="line-clamp-2 text-sm text-muted-foreground">
                    {service.description}
                  </span>
                ) : null}
                <span className="mt-auto inline-flex items-center gap-1 text-xs text-muted-foreground">
                  <Clock className="size-3.5" aria-hidden />
                  {formatDuration(service.durationMinutes)}
                </span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
