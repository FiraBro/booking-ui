"use client";

import { CalendarCheck } from "lucide-react";
import { Suspense } from "react";
import { EmptyState } from "@/components/shared/empty-state";
import { TableSkeleton } from "@/components/shared/loading-skeleton";
import { PageHeader } from "@/components/shared/page-header";
import { BookingFilterBar } from "@/features/bookings/components/booking-filter-bar";
import { BookingsTable } from "@/features/bookings/components/booking-table";
import { useBookingFilters } from "@/features/bookings/hooks/use-booking-filters";
import { useBookings } from "@/features/bookings/hooks/use-bookings";

function StaffBookingsContent() {
  const { filters, update, reset } = useBookingFilters();
  const query = useBookings({
    ...filters,
    sortBy: filters.sortBy ?? "start_time",
    sortOrder: filters.sortOrder ?? "asc",
  });
  const meta = query.data?.meta;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Bookings"
        description="Appointments assigned to you. Confirm, start or complete them here."
      />

      <BookingFilterBar
        filters={filters}
        onChange={update}
        onReset={() => reset()}
        searchPlaceholder="Search by customer or service"
      />

      <BookingsTable
        role="staff"
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
                onPageChange: (page) => update({ page }),
                onPageSizeChange: (pageSize) => update({ pageSize }),
              }
            : undefined
        }
        emptyState={
          <EmptyState
            icon={CalendarCheck}
            title="No bookings found"
            description="Try changing or resetting your filters."
          />
        }
      />
    </div>
  );
}

export default function StaffBookingsPage() {
  return (
    <Suspense fallback={<TableSkeleton />}>
      <StaffBookingsContent />
    </Suspense>
  );
}
