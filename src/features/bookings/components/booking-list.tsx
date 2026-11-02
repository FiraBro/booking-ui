"use client";

import { BookingRowActions } from "@/features/bookings/components/booking-row-actions";
import { BookingStatusBadge } from "@/features/bookings/components/booking-status-badge";
import { getBookingHref, personName } from "@/features/bookings/lib/display";
import type { UserRole } from "@/lib/constants";
import { formatDate, formatTime } from "@/lib/format";
import type { Booking } from "@/types";

interface BookingListProps {
  bookings: Booking[];
  role: UserRole;
  /** Show the calendar date instead of the time (for lists spanning several days). */
  showDate?: boolean;
}

export function BookingList({ bookings, role, showDate }: BookingListProps) {
  return (
    <ul className="divide-y rounded-lg border bg-card">
      {bookings.map((booking) => (
        <li key={booking.id} className="flex items-center gap-3 p-4">
          <div className="w-20 shrink-0 text-sm">
            <p className="tabular font-medium">
              {showDate
                ? formatDate(booking.startTime, "MMM d")
                : formatTime(booking.startTime)}
            </p>
            {showDate ? (
              <p className="tabular text-xs text-muted-foreground">
                {formatTime(booking.startTime)}
              </p>
            ) : null}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate font-medium">
              {booking.service?.name ?? "Service"}
            </p>
            <p className="truncate text-sm text-muted-foreground">
              {role === "customer"
                ? booking.staff
                  ? personName(booking.staff)
                  : "Assigned automatically"
                : personName(booking.customer)}
            </p>
          </div>
          <BookingStatusBadge
            status={booking.status}
            className="hidden sm:inline-flex"
          />
          <BookingRowActions
            booking={booking}
            role={role}
            detailHref={getBookingHref(role, booking.id)}
          />
        </li>
      ))}
    </ul>
  );
}
