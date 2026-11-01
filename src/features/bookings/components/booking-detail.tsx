import type { ReactNode } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  BookingPaymentBadge,
  BookingStatusBadge,
} from "@/features/bookings/components/booking-status-badge";
import { BookingRowActions } from "@/features/bookings/components/booking-row-actions";
import { personName } from "@/features/bookings/lib/display";
import type { UserRole } from "@/lib/constants";
import {
  formatCurrency,
  formatDateTime,
  formatDuration,
  formatLongDate,
  formatTimeRange,
  minutesBetween,
} from "@/lib/format";
import type { Booking } from "@/types";

function DetailRow({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <div className="space-y-1">
      <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </dt>
      <dd className="text-sm">{children}</dd>
    </div>
  );
}

interface BookingDetailsProps {
  booking: Booking;
  role: UserRole;
  /** Optional payment panel shown beside the booking (the payments feature supplies it). */
  paymentSection?: ReactNode;
}

export function BookingDetails({
  booking,
  role,
  paymentSection,
}: BookingDetailsProps) {
  const duration =
    booking.service?.durationMinutes ??
    minutesBetween(booking.startTime, booking.endTime);
  const showCustomer = role !== "customer";

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <Card className="lg:col-span-2">
        <CardHeader>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
              <CardTitle className="text-xl">
                {booking.service?.name ?? "Booking"}
              </CardTitle>
              {booking.reference ? (
                <p className="mt-1 text-sm text-muted-foreground">
                  Reference #{booking.reference}
                </p>
              ) : null}
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <BookingStatusBadge status={booking.status} />
              <BookingPaymentBadge status={booking.paymentStatus} />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <dl className="grid gap-5 sm:grid-cols-2">
            <DetailRow label="Date">
              {formatLongDate(booking.startTime)}
            </DetailRow>
            <DetailRow label="Time">
              <span className="tabular">
                {formatTimeRange(booking.startTime, booking.endTime)}
              </span>
            </DetailRow>
            <DetailRow label="Duration">{formatDuration(duration)}</DetailRow>
            <DetailRow label="Total">
              <span className="tabular font-semibold">
                {formatCurrency(booking.totalPrice, booking.currency)}
              </span>
            </DetailRow>
            <DetailRow label="Staff">
              {booking.staff
                ? personName(booking.staff)
                : booking.staffId
                  ? "Staff member"
                  : "Assigned automatically"}
            </DetailRow>
            {showCustomer ? (
              <DetailRow label="Customer">
                <p>{personName(booking.customer)}</p>
                {booking.customer?.email ? (
                  <p className="text-muted-foreground">
                    {booking.customer.email}
                  </p>
                ) : null}
                {booking.customer?.phone ? (
                  <p className="text-muted-foreground">
                    {booking.customer.phone}
                  </p>
                ) : null}
              </DetailRow>
            ) : null}
            {booking.notes ? (
              <div className="sm:col-span-2">
                <DetailRow label="Notes">
                  <p className="whitespace-pre-wrap">{booking.notes}</p>
                </DetailRow>
              </div>
            ) : null}
            {booking.cancellationReason ? (
              <div className="sm:col-span-2">
                <DetailRow label="Cancellation reason">
                  <p className="whitespace-pre-wrap">
                    {booking.cancellationReason}
                  </p>
                </DetailRow>
              </div>
            ) : null}
            <DetailRow label="Booked on">
              {formatDateTime(booking.createdAt)}
            </DetailRow>
            <DetailRow label="Last updated">
              {formatDateTime(booking.updatedAt)}
            </DetailRow>
          </dl>
        </CardContent>
      </Card>

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <BookingRowActions booking={booking} role={role} layout="buttons" />
          </CardContent>
        </Card>
        {paymentSection}
      </div>
    </div>
  );
}
