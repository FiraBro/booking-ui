import { keepPreviousData, useQuery } from "@tanstack/react-query";
import {
  reportsApi,
  type ReportRange,
} from "@/features/reports/api/reports.api";
import { queryKeys, STALE_TIME } from "@/lib/constants";

const base = {
  staleTime: STALE_TIME.default,
  placeholderData: keepPreviousData,
  meta: { silent: true },
} as const;

export function useBookingsReport(range: ReportRange) {
  return useQuery({
    ...base,
    queryKey: queryKeys.reports.bookings({ ...range }),
    queryFn: () => reportsApi.bookings(range),
  });
}

export function useRevenueReport(range: ReportRange) {
  return useQuery({
    ...base,
    queryKey: queryKeys.reports.revenue({ ...range }),
    queryFn: () => reportsApi.revenue(range),
  });
}

export function useServicesReport(range: ReportRange) {
  return useQuery({
    ...base,
    queryKey: queryKeys.reports.services({ ...range }),
    queryFn: () => reportsApi.services(range),
  });
}

export function useStaffPerformanceReport(range: ReportRange) {
  return useQuery({
    ...base,
    queryKey: queryKeys.reports.staffPerformance({ ...range }),
    queryFn: () => reportsApi.staffPerformance(range),
  });
}

export function useCustomersReport(range: ReportRange) {
  return useQuery({
    ...base,
    queryKey: queryKeys.reports.customers({ ...range }),
    queryFn: () => reportsApi.customers(range),
  });
}
