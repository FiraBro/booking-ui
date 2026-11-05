import { api } from "@/lib/api/client";
import { endpoints } from "@/lib/api/endpoints";
import { hasErrorKind } from "@/lib/api/error";
import { removeEmptyValues } from "@/lib/utils";
import {
  checkoutSessionSchema,
  paymentStatusInfoSchema,
} from "@/lib/validations/auth";
import type { CheckoutSession, PaymentStatusInfo, RefundInput } from "@/types";

/**
 * POST /payments/checkout. The backend creates the provider session and returns a redirect URL only.
 * `returnUrl` is the absolute URL of the booking page; the provider sends the customer back to it.
 */
async function checkout(
  bookingId: string,
  returnUrl: string,
): Promise<CheckoutSession> {
  const successUrl = new URL(returnUrl);
  successUrl.searchParams.set("payment", "success");
  const cancelUrl = new URL(returnUrl);
  cancelUrl.searchParams.set("payment", "cancelled");

  return api.post<CheckoutSession>(
    endpoints.payments.checkout,
    {
      bookingId,
      successUrl: successUrl.toString(),
      cancelUrl: cancelUrl.toString(),
    },
    {
      headers: { "Content-Type": "application/json" },
      withCredentials: true,
      schema: checkoutSessionSchema,
    },
  );
}

/** GET /payments/{bookingId}/status. A 404 means no payment exists yet, which the UI treats as "unpaid". */
async function status(bookingId: string): Promise<PaymentStatusInfo> {
  try {
    return await api.get<PaymentStatusInfo>(
      endpoints.payments.status(bookingId),
      {
        schema: paymentStatusInfoSchema,
      },
    );
  } catch (error) {
    if (hasErrorKind(error, "not_found"))
      return { bookingId, status: "unpaid" };
    throw error;
  }
}

async function refund(bookingId: string, input: RefundInput): Promise<void> {
  await api.post<unknown>(
    endpoints.payments.refund(bookingId),
    removeEmptyValues({ ...input }),
  );
}

export const paymentsApi = { checkout, status, refund };
