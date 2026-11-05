import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { useCallback } from "react";
import {
  bookingsApi,
  type BookingListParams,
} from "@/features/bookings/api/bookings.api";
import { attachService, attachServices } from "@/features/bookings/lib/enrich";
import { useServiceMap } from "@/features/services/hooks/use-service-map";
import { queryKeys, STALE_TIME } from "@/lib/constants";
import type { Booking, PaginatedResponse } from "@/types";

/** GET /bookings. Admins see everything; staff see their assigned bookings (scoped by the backend). */
export function useBookings(
  params: BookingListParams = {},
  options: { enabled?: boolean } = {},
) {
  const services = useServiceMap();
  const select = useCallback(
    (page: PaginatedResponse<Booking>) => attachServices(page, services),
    [services],
  );
  return useQuery({
    queryKey: queryKeys.bookings.list({ ...params }),
    queryFn: () => bookingsApi.list(params),
    select,
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
  const services = useServiceMap();
  const select = useCallback(
    (page: PaginatedResponse<Booking>) => attachServices(page, services),
    [services],
  );
  return useQuery({
    queryKey: queryKeys.bookings.mine({ ...params }),
    queryFn: () => bookingsApi.mine(params),
    select,
    placeholderData: keepPreviousData,
    staleTime: STALE_TIME.short,
    enabled: options.enabled ?? true,
  });
}

export function useBooking(id: string | undefined) {
  const services = useServiceMap();
  const select = useCallback(
    (booking: Booking) => attachService(booking, services),
    [services],
  );
  return useQuery({
    queryKey: queryKeys.bookings.detail(id ?? ""),
    queryFn: () => bookingsApi.get(id as string),
    select,
    enabled: Boolean(id),
    staleTime: STALE_TIME.short,
  });
}
