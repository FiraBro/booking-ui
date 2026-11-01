"use client";

import { CircleCheck, CircleX } from "lucide-react";
import { Suspense, useState } from "react";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { EmptyState } from "@/components/shared/empty-state";
import { TableSkeleton } from "@/components/shared/loading-skeleton";
import { PageHeader } from "@/components/shared/page-header";
import { notify } from "@/components/shared/toast";
import { Button } from "@/components/ui/button";
import { BookingFilterBar } from "@/features/bookings/components/booking-filter-bar";
import { BookingsTable } from "@/features/bookings/components/booking-table";
import { useBookingFilters } from "@/features/bookings/hooks/use-booking-filters";
import { useBulkUpdateBookingStatus } from "@/features/bookings/hooks/use-booking-mutations";
import { useBookings } from "@/features/bookings/hooks/use-bookings";
import type { BookingStatus } from "@/lib/constants";

function AdminBookingsContent() {
  const { filters, update, reset } = useBookingFilters();
  const query = useBookings({
    ...filters,
    sortBy: filters.sortBy ?? "start_time",
    sortOrder: filters.sortOrder ?? "desc",
  });
  const bulk = useBulkUpdateBookingStatus();
  const [selected, setSelected] = useState<string[]>([]);
  const [confirmCancel, setConfirmCancel] = useState(false);
  const meta = query.data?.meta;

  const hasFilters = Boolean(
    filters.search ||
    (filters.status && filters.status !== "all") ||
    filters.dateFrom ||
    filters.dateTo ||
    filters.staffId ||
    filters.serviceId ||
    filters.customerId,
  );

  function runBulk(status: BookingStatus) {
    bulk.mutate(
      { ids: selected, status },
      {
        onSuccess: ({ succeeded, failed }) => {
          if (failed.length === 0) {
            notify.success(
              `${succeeded.length} booking${succeeded.length === 1 ? "" : "s"} updated`,
            );
          } else {
            notify.warning(
              `${succeeded.length} updated, ${failed.length} failed`,
              "Some bookings can't move to that status from their current one.",
            );
          }
          setSelected(failed);
          setConfirmCancel(false);
        },
        onError: (error) => {
          notify.apiError(error);
          setConfirmCancel(false);
        },
      },
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Bookings"
        description="Search, filter and manage every booking."
      />

      <BookingFilterBar
        filters={filters}
        onChange={(patch) => {
          setSelected([]);
          update(patch);
        }}
        onReset={() => {
          setSelected([]);
          reset();
        }}
        showStaffFilter
        showServiceFilter
        searchPlaceholder="Search by customer, service or reference"
      />

      <BookingsTable
        role="admin"
        data={query.data?.items}
        isLoading={query.isPending}
        isFetching={query.isFetching}
        error={query.error}
        onRetry={() => void query.refetch()}
        sort={{ sortBy: filters.sortBy, sortOrder: filters.sortOrder }}
        onSortChange={(sort) =>
          update({ sortBy: sort.sortBy, sortOrder: sort.sortOrder })
        }
        pagination={
          meta
            ? {
                meta,
                onPageChange: (page) => {
                  setSelected([]);
                  update({ page });
                },
                onPageSizeChange: (pageSize) => {
                  setSelected([]);
                  update({ pageSize });
                },
              }
            : undefined
        }
        selectedIds={selected}
        onSelectedIdsChange={setSelected}
        bulkActions={() => (
          <>
            <Button
              size="sm"
              variant="outline"
              disabled={bulk.isPending}
              onClick={() => runBulk("confirmed")}
            >
              <CircleCheck aria-hidden />
              Confirm selected
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="text-destructive hover:text-destructive"
              disabled={bulk.isPending}
              onClick={() => setConfirmCancel(true)}
            >
              <CircleX aria-hidden />
              Cancel selected
            </Button>
          </>
        )}
        emptyState={
          <EmptyState
            title={
              hasFilters ? "No bookings match your filters" : "No bookings yet"
            }
            description={
              hasFilters
                ? "Try removing a filter or searching for something else."
                : "Bookings will appear here once customers book."
            }
            action={
              hasFilters ? (
                <Button variant="outline" size="sm" onClick={() => reset()}>
                  Reset filters
                </Button>
              ) : undefined
            }
          />
        }
      />

      <ConfirmDialog
        open={confirmCancel}
        onOpenChange={setConfirmCancel}
        title={`Cancel ${selected.length} booking${selected.length === 1 ? "" : "s"}?`}
        description="Customers may be notified. This can't be undone."
        confirmLabel="Cancel bookings"
        cancelLabel="Keep bookings"
        variant="destructive"
        loading={bulk.isPending}
        onConfirm={() => runBulk("cancelled")}
      />
    </div>
  );
}

export default function AdminBookingsPage() {
  return (
    <Suspense fallback={<TableSkeleton />}>
      <AdminBookingsContent />
    </Suspense>
  );
}
