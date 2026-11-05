"use client";

import { useQueryClient } from "@tanstack/react-query";
import { CreditCard, LoaderCircle, RefreshCw, Undo2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { notify } from "@/components/shared/toast";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ROUTES } from "@/config/routes";
import { BookingPaymentBadge } from "@/features/bookings/components/booking-status-badge";
import { RefundDialog } from "@/features/payments/components/refund-dialog";
import {
  useCheckout,
  usePaymentStatus,
} from "@/features/payments/hooks/use-payments";
import { isSafeRedirectUrl } from "@/features/payments/lib/checkout";
import { getErrorMessage } from "@/lib/api/error";
import {
  queryKeys,
  type BookingStatus,
  type PaymentStatus,
  type UserRole,
} from "@/lib/constants";
import { formatCurrency, formatDateTime } from "@/lib/format";
import type { Booking } from "@/types";

const PAYABLE_BOOKING_STATUSES: readonly BookingStatus[] = [
  "pending",
  "confirmed",
];
const REFUNDABLE: readonly PaymentStatus[] = ["paid", "partially_refunded"];

interface PaymentPanelProps {
  booking: Booking;
  role: UserRole;
  /** Value of the `?payment=` query parameter when the customer returns from the provider. */
  returnState?: string | null;
}

export function PaymentPanel({
  booking,
  role,
  returnState,
}: PaymentPanelProps) {
  const queryClient = useQueryClient();
  const confirming = returnState === "success";
  const payment = usePaymentStatus(booking.id, { watch: confirming });
  const checkout = useCheckout();
  const [redirecting, setRedirecting] = useState(false);
  const [refundOpen, setRefundOpen] = useState(false);

  const info = payment.data;
  const status: PaymentStatus =
    info?.status ?? booking.paymentStatus ?? "unpaid";
  const amount = info?.amount ?? booking.totalPrice;
  const currency = info?.currency ?? booking.currency;
  const refunded = info?.refundedAmount ?? 0;

  // When the payment status changes (webhook processed, refund done), refresh the booking too.
  const previous = useRef<PaymentStatus | undefined>(undefined);
  useEffect(() => {
    if (previous.current && previous.current !== status) {
      void queryClient.invalidateQueries({ queryKey: queryKeys.bookings.all });
      void queryClient.invalidateQueries({
        queryKey: queryKeys.bookings.detail(booking.id),
      });
    }
    previous.current = status;
  }, [status, booking.id, queryClient]);

  const canPay =
    role === "customer" &&
    PAYABLE_BOOKING_STATUSES.includes(booking.status) &&
    (status === "unpaid" ||
      status === "failed" ||
      (status === "pending" && !confirming));
  const canRefund = role === "admin" && REFUNDABLE.includes(status);
  const maxRefund = amount ? Math.max(amount - refunded, 0) : null;
  const waitingForProvider =
    confirming &&
    !["paid", "failed", "refunded", "partially_refunded"].includes(status);

  function startCheckout() {
    checkout.mutate(
      {
        bookingId: booking.id,
        returnPath: ROUTES.customer.bookingDetail(booking.id),
      },
      {
        onSuccess: (session) => {
          if (session.checkoutUrl && isSafeRedirectUrl(session.checkoutUrl)) {
            setRedirecting(true);
            window.location.assign(session.checkoutUrl);
            return;
          }
          notify.error(
            "We couldn't start the payment",
            "The payment link was missing or invalid.",
          );
        },
        onError: (error) => notify.error(getErrorMessage(error)),
      },
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between gap-2">
          <CardTitle className="text-base">Payment</CardTitle>
          {payment.isPending && !booking.paymentStatus ? (
            <Skeleton className="h-6 w-20" />
          ) : (
            <BookingPaymentBadge status={status} />
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <dl className="space-y-2 text-sm">
          <div className="flex justify-between gap-4">
            <dt className="text-muted-foreground">Amount</dt>
            <dd className="tabular font-medium">
              {formatCurrency(amount, currency)}
            </dd>
          </div>
          {info?.paidAt ? (
            <div className="flex justify-between gap-4">
              <dt className="text-muted-foreground">Paid on</dt>
              <dd>{formatDateTime(info.paidAt)}</dd>
            </div>
          ) : null}
          {refunded > 0 ? (
            <div className="flex justify-between gap-4">
              <dt className="text-muted-foreground">Refunded</dt>
              <dd className="tabular">{formatCurrency(refunded, currency)}</dd>
            </div>
          ) : null}
        </dl>

        {waitingForProvider ? (
          <Alert role="status">
            <LoaderCircle className="animate-spin" aria-hidden />
            <AlertDescription>
              We&apos;re confirming your payment. This usually takes a few
              seconds.
            </AlertDescription>
          </Alert>
        ) : null}

        {returnState === "cancelled" && status !== "paid" ? (
          <Alert>
            <AlertDescription>
              The payment was cancelled. You can try again whenever you&apos;re
              ready.
            </AlertDescription>
          </Alert>
        ) : null}

        {status === "failed" ? (
          <Alert variant="destructive">
            <AlertDescription>
              {info?.failureReason ??
                "The payment didn't go through. Please try again."}
            </AlertDescription>
          </Alert>
        ) : null}

        {payment.isError ? (
          <Alert variant="destructive">
            <AlertDescription>
              We couldn&apos;t refresh the payment status. Your booking details
              are still available, and you can try checkout again.
            </AlertDescription>
          </Alert>
        ) : null}

        {checkout.isError ? (
          <Alert variant="destructive" role="alert">
            <AlertDescription>
              {getErrorMessage(checkout.error)}
            </AlertDescription>
          </Alert>
        ) : null}

        <div className="flex flex-wrap gap-2">
          {canPay ? (
            <Button
              onClick={startCheckout}
              disabled={checkout.isPending || redirecting}
              className={checkout.isError ? "w-full sm:w-auto" : undefined}
              size={checkout.isError ? "lg" : "default"}
            >
              {checkout.isPending || redirecting ? (
                <LoaderCircle className="animate-spin" aria-hidden />
              ) : (
                <CreditCard aria-hidden />
              )}
              {redirecting
                ? "Redirecting…"
                : checkout.isError || status === "failed"
                  ? "Retry Payment"
                  : "Pay now"}
            </Button>
          ) : null}

          {canRefund ? (
            <Button variant="outline" onClick={() => setRefundOpen(true)}>
              <Undo2 aria-hidden />
              Refund
            </Button>
          ) : null}

          <Button
            variant="ghost"
            size="sm"
            onClick={() => void payment.refetch()}
            disabled={payment.isFetching}
          >
            <RefreshCw
              className={payment.isFetching ? "animate-spin" : undefined}
              aria-hidden
            />
            Refresh status
          </Button>
        </div>
      </CardContent>

      {refundOpen ? (
        <RefundDialog
          bookingId={booking.id}
          maxAmount={maxRefund}
          currency={currency}
          onClose={() => setRefundOpen(false)}
        />
      ) : null}
    </Card>
  );
}
