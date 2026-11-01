"use client";

import { useParams } from "next/navigation";
import { ErrorState } from "@/components/shared/error-state";
import { PageSkeleton } from "@/components/shared/loading-skeleton";
import { PageHeader } from "@/components/shared/page-header";
import { ROUTES } from "@/config/routes";
import { BookingDetails } from "@/features/bookings/components/booking-detail";

import { useBooking } from "@/features/bookings/hooks/use-bookings";

export default function CustomerBookingDetailPage() {
  const { bookingId } = useParams<{ bookingId: string }>();
  const query = useBooking(bookingId);

  const header = (
    <PageHeader
      title="Booking details"
      back={{ href: ROUTES.customer.bookings, label: "My bookings" }}
    />
  );

  if (query.isPending) return <PageSkeleton />;

  if (query.isError || !query.data) {
    return (
      <div className="space-y-6">
        {header}
        <ErrorState error={query.error} onRetry={() => void query.refetch()} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {header}
      <BookingDetails booking={query.data} role="customer" />
    </div>
  );
}
