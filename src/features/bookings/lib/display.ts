import { ROUTES } from "@/config/routes";
import type { UserRole } from "@/lib/constants";

interface NameLike {
  firstName?: string | null;
  lastName?: string | null;
  name?: string | null;
  email?: string | null;
}

export function personName(
  source: NameLike | null | undefined,
  fallback = "Unknown",
): string {
  if (!source) return fallback;
  const composed = [source.firstName, source.lastName]
    .filter(Boolean)
    .join(" ")
    .trim();
  return composed || source.name || source.email || fallback;
}

/** Detail page for a booking, per role. Staff have no detail page, only the list. */
export function getBookingHref(
  role: UserRole,
  bookingId: string,
): string | null {
  if (role === "customer") return ROUTES.customer.bookingDetail(bookingId);
  if (role === "admin") return ROUTES.admin.bookingDetail(bookingId);
  return null;
}
