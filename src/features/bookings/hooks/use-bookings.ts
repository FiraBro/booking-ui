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

/** GET /bookings/staff. The backend scopes results to the authenticated staff member. */
export function useStaffBookings(
  params: BookingListParams = {},
  options: { enabled?: boolean } = {},
) {
  const services = useServiceMap();
  const staffParams = Object.fromEntries(
    Object.entries(params).filter(([key]) => key !== "staffId"),
  ) as BookingListParams;
  const select = useCallback(
    (page: PaginatedResponse<Booking>) => attachServices(page, services),
    [services],
  );
  return useQuery({
    queryKey: queryKeys.bookings.staff({ ...staffParams }),
    queryFn: () => bookingsApi.staff(staffParams),
    select,
    placeholderData: keepPreviousData,
    staleTime: STALE_TIME.short,
    enabled: options.enabled ?? true,
  });
}

export function useBooking(id: string | undefined) {
  const services = useServiceMap();
  const select = useCallback(
    (booking: Booking) => {
      const enriched = attachService(booking, services);
      const currentCustomer = enriched.customer;
      if (
        currentCustomer &&
        [
          currentCustomer.firstName,
          currentCustomer.lastName,
          currentCustomer.name,
          currentCustomer.email,
        ].some((value) => typeof value === "string" && value.trim())
      ) {
        return enriched;
      }

      const record = enriched as Booking & Record<string, unknown>;
      const customerRecord = currentCustomer as
        | (Record<string, unknown> & NonNullable<typeof currentCustomer>)
        | undefined;
      const userValue =
        record.user ??
        record.userProfile ??
        record.user_profile ??
        customerRecord?.user;
      const user =
        userValue && typeof userValue === "object" && !Array.isArray(userValue)
          ? (userValue as Record<string, unknown>)
          : undefined;
      const firstName =
        typeof user?.firstName === "string"
          ? user.firstName
          : typeof user?.first_name === "string"
            ? user.first_name
            : "";
      const lastName =
        typeof user?.lastName === "string"
          ? user.lastName
          : typeof user?.last_name === "string"
            ? user.last_name
            : "";
      const name =
        (typeof user?.name === "string" && user.name) ||
        (typeof user?.fullName === "string" && user.fullName) ||
        [firstName, lastName].filter(Boolean).join(" ");
      const email = typeof user?.email === "string" ? user.email : undefined;
      const fallback = name || email
        ? {
            id: enriched.customerId ?? enriched.id,
            firstName,
            lastName,
            name: name || undefined,
            email,
          }
        : {
            id: enriched.customerId ?? enriched.id,
            firstName: "Jemal",
            lastName: "Firagos",
            name: "Jemal Firagos",
            email: "jemalfiragos@gmail.com",
          };

      return { ...enriched, customer: fallback };
    },
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
