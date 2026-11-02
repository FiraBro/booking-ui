"use client";

import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { PaymentPanel } from "@/features/payments/components/payment-panel";
import type { UserRole } from "@/lib/constants";
import type { Booking } from "@/types";

function PaymentSectionContent({
  booking,
  role,
}: {
  booking: Booking;
  role: UserRole;
}) {
  const returnState = useSearchParams().get("payment");
  return (
    <PaymentPanel booking={booking} role={role} returnState={returnState} />
  );
}

/** Wraps the panel in the Suspense boundary that useSearchParams needs. */
export function PaymentSection({
  booking,
  role,
}: {
  booking: Booking;
  role: UserRole;
}) {
  return (
    <Suspense fallback={<Skeleton className="h-44 w-full" />}>
      <PaymentSectionContent booking={booking} role={role} />
    </Suspense>
  );
}
