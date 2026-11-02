"use client";

import { LoaderCircle } from "lucide-react";
import { useState } from "react";
import { EmptyState } from "@/components/shared/empty-state";
import { ErrorState } from "@/components/shared/error-state";
import { ListSkeleton } from "@/components/shared/loading-skeleton";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { useServices } from "@/features/services/hooks/use-services";
import { useStaffServices } from "@/features/staff/hooks/use-staff";
import { useSetStaffServices } from "@/features/staff/hooks/use-staff-mutations";
import { formatCurrency, formatDuration } from "@/lib/format";

export function StaffServicesForm({ staffId }: { staffId: string }) {
  const services = useServices({ page: 1, pageSize: 100 });
  const assigned = useStaffServices(staffId);
  const save = useSetStaffServices();
  const [draft, setDraft] = useState<string[] | null>(null);

  if (services.isPending || assigned.isPending)
    return <ListSkeleton rows={4} />;

  if (services.isError || assigned.isError) {
    return (
      <ErrorState
        error={services.error ?? assigned.error}
        onRetry={() => {
          void services.refetch();
          void assigned.refetch();
        }}
      />
    );
  }

  const items = services.data?.items ?? [];
  if (items.length === 0) {
    return (
      <EmptyState
        title="No services exist yet"
        description="Create a service first, then assign it here."
      />
    );
  }

  const selected = draft ?? assigned.data ?? [];

  function toggle(id: string) {
    setDraft(
      selected.includes(id)
        ? selected.filter((value) => value !== id)
        : [...selected, id],
    );
  }

  return (
    <div className="space-y-4">
      <ul className="divide-y rounded-lg border">
        {items.map((service) => {
          const inputId = `staff-service-${service.id}`;
          return (
            <li key={service.id} className="flex items-center gap-3 p-3">
              <Checkbox
                id={inputId}
                checked={selected.includes(service.id)}
                onCheckedChange={() => toggle(service.id)}
              />
              <Label
                htmlFor={inputId}
                className="flex flex-1 flex-col items-start gap-0.5 font-normal"
              >
                <span className="font-medium">{service.name}</span>
                <span className="text-xs text-muted-foreground">
                  {formatDuration(service.durationMinutes)} ·{" "}
                  {formatCurrency(service.price, service.currency)}
                  {!service.isActive ? " · Inactive" : ""}
                </span>
              </Label>
            </li>
          );
        })}
      </ul>
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          {selected.length} selected
        </p>
        <Button
          disabled={draft === null || save.isPending}
          onClick={() =>
            save.mutate(
              { id: staffId, serviceIds: selected },
              { onSuccess: () => setDraft(null) },
            )
          }
        >
          {save.isPending ? (
            <LoaderCircle className="animate-spin" aria-hidden />
          ) : null}
          Save services
        </Button>
      </div>
    </div>
  );
}
