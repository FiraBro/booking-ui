"use client";

import { Eye, Undo2 } from "lucide-react";
import { useState } from "react";
import {
  DataTable,
  type DataTableColumn,
} from "@/components/shared/data-table";
import { EmptyState } from "@/components/shared/empty-state";
import { PageHeader } from "@/components/shared/page-header";
import { RowMenu, type RowMenuItem } from "@/components/shared/row-menu";
import { SearchInput } from "@/components/shared/search-input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ROUTES } from "@/config/routes";
import type { BookingListParams } from "@/features/bookings/api/bookings.api";
import {
  BookingPaymentBadge,
  BookingStatusBadge,
} from "@/features/bookings/components/booking-status-badge";
import { useBookings } from "@/features/bookings/hooks/use-bookings";
import { personName } from "@/features/bookings/lib/display";
import { RefundDialog } from "@/features/payments/components/refund-dialog";
import {
  DEFAULT_PAGE_SIZE,
  PAYMENT_STATUSES,
  PAYMENT_STATUS_LABELS,
} from "@/lib/constants";
import { formatCurrency, formatDate } from "@/lib/format";
import type { Booking } from "@/types";

const ALL = "all";

export default function AdminPaymentsPage() {
  const [status, setStatus] = useState<string>(ALL);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState<number>(DEFAULT_PAGE_SIZE);
  const [refundTarget, setRefundTarget] = useState<Booking | null>(null);

  const params: BookingListParams & { paymentStatus?: string } = {
    page,
    pageSize,
    search,
    paymentStatus: status,
    sortBy: "start_time",
    sortOrder: "desc",
  };
  const query = useBookings(params);
  const meta = query.data?.meta;
  // Also filter locally, in case the API ignores the payment_status parameter.
  const items = query.data?.items.filter(
    (booking) => status === ALL || booking.paymentStatus === status,
  );

  const columns: DataTableColumn<Booking>[] = [
    {
      id: "booking",
      header: "Booking",
      cell: (booking) => (
        <div className="min-w-0">
          <p className="font-medium">{booking.service?.name ?? "Service"}</p>
          {booking.reference ? (
            <p className="text-xs text-muted-foreground">
              #{booking.reference}
            </p>
          ) : null}
        </div>
      ),
    },
    {
      id: "customer",
      header: "Customer",
      hideBelow: "md",
      cell: (booking) => (
        <div className="min-w-0">
          <p className="truncate">{personName(booking.customer)}</p>
          {booking.customer?.email ? (
            <p className="truncate text-xs text-muted-foreground">
              {booking.customer.email}
            </p>
          ) : null}
        </div>
      ),
    },
    {
      id: "date",
      header: "Date",
      hideBelow: "sm",
      cell: (booking) => formatDate(booking.startTime),
    },
    {
      id: "amount",
      header: "Amount",
      align: "right",
      cell: (booking) => (
        <span className="tabular">
          {formatCurrency(booking.totalPrice, booking.currency)}
        </span>
      ),
    },
    {
      id: "payment",
      header: "Payment",
      cell: (booking) => <BookingPaymentBadge status={booking.paymentStatus} />,
    },
    {
      id: "status",
      header: "Booking",
      hideBelow: "lg",
      cell: (booking) => <BookingStatusBadge status={booking.status} />,
    },
    {
      id: "actions",
      header: <span className="sr-only">Actions</span>,
      align: "right",
      cell: (booking) => {
        const items: RowMenuItem[] = [
          {
            key: "view",
            label: "View booking",
            icon: Eye,
            href: ROUTES.admin.bookingDetail(booking.id),
          },
        ];
        if (
          booking.paymentStatus === "paid" ||
          booking.paymentStatus === "partially_refunded"
        ) {
          items.push({
            key: "refund",
            label: "Refund",
            icon: Undo2,
            onSelect: () => setRefundTarget(booking),
            separatorBefore: true,
          });
        }
        return (
          <RowMenu
            label={`Actions for booking ${booking.reference ?? booking.id}`}
            items={items}
          />
        );
      },
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Payments"
        description="Payment status for every booking. Refunds are issued from the row menu."
      />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <SearchInput
          value={search}
          onChange={(next) => {
            setSearch(next);
            setPage(1);
          }}
          placeholder="Search by customer or reference"
        />
        <Select
          value={status}
          onValueChange={(next) => {
            setStatus(next);
            setPage(1);
          }}
        >
          <SelectTrigger
            aria-label="Filter by payment status"
            className="w-full sm:w-52"
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>All payment statuses</SelectItem>
            {PAYMENT_STATUSES.map((value) => (
              <SelectItem key={value} value={value}>
                {PAYMENT_STATUS_LABELS[value]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <DataTable<Booking>
        caption="Payments by booking"
        columns={columns}
        data={items}
        getRowId={(booking) => booking.id}
        isLoading={query.isPending}
        isFetching={query.isFetching}
        error={query.error}
        onRetry={() => void query.refetch()}
        pagination={
          meta
            ? {
                meta,
                onPageChange: setPage,
                onPageSizeChange: (next) => {
                  setPageSize(next);
                  setPage(1);
                },
              }
            : undefined
        }
        emptyState={
          <EmptyState
            title="No payments found"
            description="Try another status or search term."
          />
        }
      />

      {refundTarget ? (
        <RefundDialog
          bookingId={refundTarget.id}
          maxAmount={refundTarget.totalPrice}
          currency={refundTarget.currency}
          onClose={() => setRefundTarget(null)}
        />
      ) : null}
    </div>
  );
}
