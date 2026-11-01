"use client";

import { CalendarPlus } from "lucide-react";
import Link from "next/link";
import { Suspense } from "react";
import { subDays } from "date-fns";
import { EmptyState } from "@/components/shared/empty-state";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TableSkeleton } from "@/components/shared/loading-skeleton";
import { ROUTES } from "@/config/routes";
import { BookingFilterBar } from "@/features/bookings/components/booking-filter-bar";
import { BookingsTable } from "@/features/bookings/components/booking-table";
import type { BookingListParams } from "@/features/bookings/api/bookings.api";
import { useBookingFilters } from "@/features/bookings/hooks/use-booking-filters";
import { useMyBookings } from "@/features/bookings/hooks/use-bookings";
import { toISODate } from "@/lib/format";
import type { BookingFilters } from "@/lib/validations/auth";

type View = "upcoming" | "past" | "all";

function parseView(value: string | null): View {
  return value === "past" || value === "all" ? value : "upcoming";
}

/** Translates the selected tab into date bounds and a sensible default sort order. */
function buildParams(filters: BookingFilters, view: View): BookingListParams {
  const now = new Date();
  if (view === "upcoming") {
    return {
      ...filters,
      dateFrom: filters.dateFrom ?? toISODate(now),
      sortBy: filters.sortBy ?? "start_time",
      sortOrder: filters.sortOrder ?? "asc",
    };
  }
  if (view === "past") {
    return {
      ...filters,
      dateTo: filters.dateTo ?? toISODate(subDays(now, 1)),
      sortBy: filters.sortBy ?? "start_time",
      sortOrder: filters.sortOrder ?? "desc",
    };
  }
  return {
    ...filters,
    sortBy: filters.sortBy ?? "start_time",
    sortOrder: filters.sortOrder ?? "desc",
  };
}

const EMPTY_COPY: Record<View, { title: string; description: string }> = {
  upcoming: {
    title: "No upcoming bookings",
    description: "Book a service and it will show up here.",
  },
  past: {
    title: "No past bookings",
    description: "Completed and cancelled bookings will appear here.",
  },
  all: {
    title: "No bookings yet",
    description: "Book your first service to get started.",
  },
};

function CustomerBookingsContent() {
  const { filters, searchParams, update, reset } = useBookingFilters();
  const view = parseView(searchParams.get("view"));
  const query = useMyBookings(buildParams(filters, view));
  const meta = query.data?.meta;
  const copy = EMPTY_COPY[view];

  const emptyState = (
    <EmptyState
      icon={CalendarPlus}
      title={copy.title}
      description={copy.description}
      action={
        <Button asChild size="sm">
          <Link href={ROUTES.customer.newBooking}>Book a service</Link>
        </Button>
      }
    />
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="My bookings"
        description="Review, reschedule or cancel your appointments."
        actions={
          <Button asChild>
            <Link href={ROUTES.customer.newBooking}>
              <CalendarPlus aria-hidden />
              New booking
            </Link>
          </Button>
        }
      />

      <Tabs
        value={view}
        onValueChange={(next) =>
          update({ view: next, dateFrom: undefined, dateTo: undefined })
        }
      >
        <TabsList>
          <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
          <TabsTrigger value="past">Past</TabsTrigger>
          <TabsTrigger value="all">All</TabsTrigger>
        </TabsList>

        <TabsContent value={view} className="mt-4 space-y-4">
          <BookingFilterBar
            filters={filters}
            onChange={update}
            onReset={() => reset(["view"])}
            showDateFilter={false}
            searchPlaceholder="Search by service or reference"
          />
          <BookingsTable
            role="customer"
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
            emptyState={emptyState}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default function CustomerBookingsPage() {
  return (
    <Suspense fallback={<TableSkeleton />}>
      <CustomerBookingsContent />
    </Suspense>
  );
}
