"use client";

import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { FormSkeleton } from "@/components/shared/loading-skeleton";
import { PageHeader } from "@/components/shared/page-header";
import { ROUTES } from "@/config/routes";
import { BookingWizard } from "@/features/bookings/components/booking-wizard";

function NewBookingContent() {
  const initialServiceId =
    useSearchParams().get("serviceId")?.trim() || undefined;
  return (
    <BookingWizard
      key={initialServiceId ?? "new"}
      initialServiceId={initialServiceId}
    />
  );
}

export default function NewBookingPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Book a service"
        description="Choose a service, pick a time and confirm."
        back={{ href: ROUTES.customer.bookings, label: "My bookings" }}
      />
      <Suspense fallback={<FormSkeleton />}>
        <NewBookingContent />
      </Suspense>
    </div>
  );
}
