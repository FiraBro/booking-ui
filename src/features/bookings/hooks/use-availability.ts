import { useQuery } from "@tanstack/react-query";
import { availabilityApi } from "@/features/bookings/api/bookings.api";
import { queryKeys, STALE_TIME } from "@/lib/constants";

/** GET /availability/services/{serviceId}?date=yyyy-MM-dd[&staff_id=...] */
export function useServiceAvailability(
  serviceId: string | undefined,
  date: string | undefined,
  staffId?: string | null,
) {
  return useQuery({
    queryKey: queryKeys.availability.service(
      serviceId ?? "",
      date ?? "",
      staffId,
    ),
    queryFn: () =>
      availabilityApi.forService(serviceId as string, {
        date: date as string,
        staffId: staffId ?? undefined,
      }),
    enabled: Boolean(serviceId && date),
    staleTime: STALE_TIME.short,
    meta: { silent: true },
  });
}

/** GET /availability/staff/{staffId}?date=yyyy-MM-dd[&service_id=...] */
export function useStaffAvailability(
  staffId: string | undefined,
  date: string | undefined,
  serviceId?: string | null,
) {
  return useQuery({
    queryKey: queryKeys.availability.staff(
      staffId ?? "",
      date ?? "",
      serviceId,
    ),
    queryFn: () =>
      availabilityApi.forStaff(staffId as string, {
        date: date as string,
        serviceId: serviceId ?? undefined,
      }),
    enabled: Boolean(staffId && date),
    staleTime: STALE_TIME.short,
    meta: { silent: true },
  });
}
