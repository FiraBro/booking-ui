"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import {
  DataTable,
  type DataTableColumn,
  type DataTablePaginationConfig,
  type DataTableSort,
} from "@/components/shared/data-table";
import {
  BookingPaymentBadge,
  BookingStatusBadge,
} from "@/features/bookings/components/booking-status-badge";
import { BookingRowActions } from "@/features/bookings/components/booking-row-actions";
import { getBookingHref, personName } from "@/features/bookings/lib/display";
import type { UserRole } from "@/lib/constants";
import { formatCurrency, formatDate, formatTimeRange } from "@/lib/format";
import type { Booking } from "@/types";

interface BookingsTableProps {
  role: UserRole;
  data: Booking[] | undefined;
  isLoading?: boolean;
  isFetching?: boolean;
  error?: unknown;
  onRetry?: () => void;
  sort?: DataTableSort;
  onSortChange?: (sort: DataTableSort) => void;
  pagination?: DataTablePaginationConfig;
  emptyState?: ReactNode;
  selectedIds?: string[];
  onSelectedIdsChange?: (ids: string[]) => void;
  bulkActions?: (selectedIds: string[]) => ReactNode;
}

export function BookingsTable({
  role,
  data,
  isLoading,
  isFetching,
  error,
  onRetry,
  sort,
  onSortChange,
  pagination,
  emptyState,
  selectedIds,
  onSelectedIdsChange,
  bulkActions,
}: BookingsTableProps) {
  const columns: DataTableColumn<Booking>[] = [
    {
      id: "service",
      header: "Service",
      cell: (booking) => {
        const href = getBookingHref(role, booking.id);
        const name = booking.service?.name ?? "Service";
        return (
          <div className="min-w-0">
            {href ? (
              <Link href={href} className="font-medium hover:underline">
                {name}
              </Link>
            ) : (
              <span className="font-medium">{name}</span>
            )}
            {booking.reference ? (
              <p className="text-xs text-muted-foreground">
                #{booking.reference}
              </p>
            ) : null}
          </div>
        );
      },
    },
    ...(role !== "customer"
      ? [
          {
            id: "customer",
            header: "Customer",
            cell: (booking: Booking) => (
              <div className="min-w-0">
                <p className="truncate">{personName(booking.customer)}</p>
                {booking.customer?.email ? (
                  <p className="truncate text-xs text-muted-foreground">
                    {booking.customer.email}
                  </p>
                ) : null}
              </div>
            ),
          } satisfies DataTableColumn<Booking>,
        ]
      : []),
    {
      id: "start",
      header: "Date & time",
      sortKey: "start_time",
      cell: (booking) => (
        <div>
          <p>{formatDate(booking.startTime)}</p>
          <p className="tabular text-xs text-muted-foreground">
            {formatTimeRange(booking.startTime, booking.endTime)}
          </p>
        </div>
      ),
    },
    ...(role !== "staff"
      ? [
          {
            id: "staff",
            header: "Staff",
            hideBelow: "md",
            cell: (booking: Booking) =>
              booking.staff ? (
                personName(booking.staff)
              ) : (
                <span className="text-muted-foreground">Unassigned</span>
              ),
          } satisfies DataTableColumn<Booking>,
        ]
      : []),
    {
      id: "status",
      header: "Status",
      sortKey: "status",
      cell: (booking) => <BookingStatusBadge status={booking.status} />,
    },
    {
      id: "payment",
      header: "Payment",
      hideBelow: "lg",
      cell: (booking) => <BookingPaymentBadge status={booking.paymentStatus} />,
    },
    {
      id: "total",
      header: "Total",
      sortKey: "total_price",
      align: "right",
      hideBelow: "sm",
      cell: (booking) => (
        <span className="tabular">
          {formatCurrency(booking.totalPrice, booking.currency)}
        </span>
      ),
    },
    {
      id: "actions",
      header: <span className="sr-only">Actions</span>,
      align: "right",
      cell: (booking) => (
        <BookingRowActions
          booking={booking}
          role={role}
          detailHref={getBookingHref(role, booking.id)}
        />
      ),
    },
  ];

  return (
    <DataTable<Booking>
      caption="Bookings"
      columns={columns}
      data={data}
      getRowId={(booking) => booking.id}
      isLoading={isLoading}
      isFetching={isFetching}
      error={error}
      onRetry={onRetry}
      sort={sort}
      onSortChange={onSortChange}
      pagination={pagination}
      emptyState={emptyState}
      selectedIds={selectedIds}
      onSelectedIdsChange={onSelectedIdsChange}
      bulkActions={bulkActions}
    />
  );
}
