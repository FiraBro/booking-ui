import { StatusBadge } from "@/components/shared/status-badge";
import type { BookingStatus, PaymentStatus } from "@/lib/constants";

export function BookingStatusBadge({
  status,
  className,
}: {
  status: BookingStatus;
  className?: string;
}) {
  return <StatusBadge status={status} kind="booking" className={className} />;
}

export function BookingPaymentBadge({
  status,
  className,
}: {
  status: PaymentStatus | null | undefined;
  className?: string;
}) {
  return <StatusBadge status={status} kind="payment" className={className} />;
}
