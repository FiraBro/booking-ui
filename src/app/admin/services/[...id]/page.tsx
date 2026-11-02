"use client";

import { Trash2 } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { ErrorState } from "@/components/shared/error-state";
import { PageSkeleton } from "@/components/shared/loading-skeleton";
import { PageHeader } from "@/components/shared/page-header";
import { StatusBadge } from "@/components/shared/status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ROUTES } from "@/config/routes";
import { ServiceForm } from "@/features/services/components/service-form";
import { useDeleteService } from "@/features/services/hooks/use-service-mutations";
import { useService } from "@/features/services/hooks/use-service";
import { formatCurrency, formatDateTime, formatDuration } from "@/lib/format";

export default function AdminServiceDetailPage() {
  const { serviceId } = useParams<{ serviceId: string }>();
  const router = useRouter();
  const query = useService(serviceId);
  const remove = useDeleteService();
  const [confirmOpen, setConfirmOpen] = useState(false);

  const back = { href: ROUTES.admin.services, label: "All services" };

  if (query.isPending) return <PageSkeleton />;

  if (query.isError || !query.data) {
    return (
      <div className="space-y-6">
        <PageHeader title="Service" back={back} />
        <ErrorState error={query.error} onRetry={() => void query.refetch()} />
      </div>
    );
  }

  const service = query.data;

  return (
    <div className="space-y-6">
      <PageHeader
        title={service.name}
        back={back}
        actions={
          <Button
            variant="outline"
            className="text-destructive hover:text-destructive"
            onClick={() => setConfirmOpen(true)}
          >
            <Trash2 aria-hidden />
            Delete
          </Button>
        }
      />

      <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
        <Card>
          <CardHeader>
            <CardTitle>Service details</CardTitle>
          </CardHeader>
          <CardContent>
            <ServiceForm
              key={service.updatedAt ?? service.id}
              service={service}
            />
          </CardContent>
        </Card>

        <Card className="self-start">
          <CardHeader>
            <CardTitle>Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="space-y-3 text-sm">
              <div className="flex justify-between gap-4">
                <dt className="text-muted-foreground">Status</dt>
                <dd>
                  <StatusBadge
                    status={service.isActive ? "active" : "inactive"}
                  />
                </dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-muted-foreground">Price</dt>
                <dd className="tabular font-medium">
                  {formatCurrency(service.price, service.currency)}
                </dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-muted-foreground">Duration</dt>
                <dd>{formatDuration(service.durationMinutes)}</dd>
              </div>
              {service.staffCount !== null &&
              service.staffCount !== undefined ? (
                <div className="flex justify-between gap-4">
                  <dt className="text-muted-foreground">Staff assigned</dt>
                  <dd>{service.staffCount}</dd>
                </div>
              ) : null}
              <div className="flex justify-between gap-4">
                <dt className="text-muted-foreground">Created</dt>
                <dd>{formatDateTime(service.createdAt)}</dd>
              </div>
            </dl>
          </CardContent>
        </Card>
      </div>

      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title={`Delete ${service.name}?`}
        description="Existing bookings keep their history, but the service can no longer be booked."
        confirmLabel="Delete service"
        variant="destructive"
        loading={remove.isPending}
        onConfirm={() =>
          remove.mutate(service.id, {
            onSuccess: () => router.replace(ROUTES.admin.services),
            onSettled: () => setConfirmOpen(false),
          })
        }
      />
    </div>
  );
}
