import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { notify } from "@/components/shared/toast";
import { paymentsApi } from "@/features/payments/api/payments.api";
import {
  PAYMENT_POLL_INTERVAL_MS,
  PAYMENT_POLL_MAX_DURATION_MS,
  queryKeys,
  STALE_TIME,
  type PaymentStatus,
} from "@/lib/constants";
import type { RefundInput } from "@/types";

const SETTLED: readonly PaymentStatus[] = [
  "paid",
  "failed",
  "refunded",
  "partially_refunded",
];
const MAX_POLLS = Math.ceil(
  PAYMENT_POLL_MAX_DURATION_MS / PAYMENT_POLL_INTERVAL_MS,
);

/**
 * Payment status for a booking. Polls while the payment is "pending", or, with `watch`
 * (the customer just came back from the provider), until it settles.
 */
export function usePaymentStatus(
  bookingId: string | undefined,
  options: { enabled?: boolean; watch?: boolean } = {},
) {
  return useQuery({
    queryKey: queryKeys.payments.status(bookingId ?? ""),
    queryFn: () => paymentsApi.status(bookingId as string),
    enabled: Boolean(bookingId) && (options.enabled ?? true),
    staleTime: STALE_TIME.short,
    meta: { silent: true },
    refetchInterval: (query) => {
      const status = query.state.data?.status;
      if (!status) return false;
      const active =
        status === "pending" ||
        (Boolean(options.watch) && !SETTLED.includes(status));
      return active && query.state.dataUpdateCount < MAX_POLLS
        ? PAYMENT_POLL_INTERVAL_MS
        : false;
    },
  });
}

export function useCheckout() {
  return useMutation({
    mutationFn: (vars: { bookingId: string; returnPath: string }) =>
      paymentsApi.checkout(
        vars.bookingId,
        `${window.location.origin}${vars.returnPath}`,
      ),
    meta: { silent: true },
  });
}

export function useRefund() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (vars: { bookingId: string; input: RefundInput }) =>
      paymentsApi.refund(vars.bookingId, vars.input),
    onSuccess: (_data, vars) => {
      notify.success("Refund requested");
      void queryClient.invalidateQueries({
        queryKey: queryKeys.payments.status(vars.bookingId),
      });
      void queryClient.invalidateQueries({ queryKey: queryKeys.bookings.all });
      void queryClient.invalidateQueries({
        queryKey: queryKeys.bookings.detail(vars.bookingId),
      });
    },
  });
}
