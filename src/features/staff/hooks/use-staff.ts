import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { staffApi, type StaffListParams } from "@/features/staff/api/staff.api";
import { queryKeys, STALE_TIME } from "@/lib/constants";

export function useStaffList(
  params: StaffListParams = {},
  options: { enabled?: boolean } = {},
) {
  return useQuery({
    queryKey: queryKeys.staff.list({ ...params }),
    queryFn: () => staffApi.list(params),
    placeholderData: keepPreviousData,
    staleTime: STALE_TIME.default,
    enabled: options.enabled ?? true,
    meta: { silent: true },
  });
}

export function useStaffMember(id: string | undefined) {
  return useQuery({
    queryKey: queryKeys.staff.detail(id ?? ""),
    queryFn: () => staffApi.get(id as string),
    enabled: Boolean(id),
    staleTime: STALE_TIME.default,
  });
}

export function useStaffServices(id: string | undefined) {
  return useQuery({
    queryKey: queryKeys.staff.services(id ?? ""),
    queryFn: () => staffApi.getServices(id as string),
    enabled: Boolean(id),
    staleTime: STALE_TIME.default,
  });
}

export function useStaffSchedule(id: string | undefined) {
  return useQuery({
    queryKey: queryKeys.staff.schedule(id ?? ""),
    queryFn: () => staffApi.getSchedule(id as string),
    enabled: Boolean(id),
    staleTime: STALE_TIME.short,
  });
}
