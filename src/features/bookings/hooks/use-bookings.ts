import { keepPreviousData, useQuery } from "@tanstack/react-query";
import {
  bookingsApi,
  type BookingListParams,
} from "@/features/bookings/api/bookings.api";
import { queryKeys, STALE_TIME } from "@/lib/constants";

/** GET /bookings. Admins see everything; staff see their assigned bookings (scoped by the backend). */
export function useBookings(
  params: BookingListParams = {},
  options: { enabled?: boolean } = {},
) {
  return useQuery({
    queryKey: queryKeys.bookings.list({ ...params }),
    queryFn: () => bookingsApi.list(params),
    placeholderData: keepPreviousData,
    staleTime: STALE_TIME.short,
    enabled: options.enabled ?? true,
  });
}

/** GET /bookings/my. */
export function useMyBookings(
  params: BookingListParams = {},
  options: { enabled?: boolean } = {},
) {
  return useQuery({
    queryKey: queryKeys.bookings.mine({ ...params }),
    queryFn: () => bookingsApi.mine(params),
    placeholderData: keepPreviousData,
    staleTime: STALE_TIME.short,
    enabled: options.enabled ?? true,
  });
}

export function useBooking(id: string | undefined) {
  return useQuery({
    queryKey: queryKeys.bookings.detail(id ?? ""),
    queryFn: () => bookingsApi.get(id as string),
    enabled: Boolean(id),
    staleTime: STALE_TIME.short,
  });
}
