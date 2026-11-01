import { keepPreviousData, useQuery } from "@tanstack/react-query";
import {
  servicesApi,
  type ServiceListParams,
} from "@/features/services/api/services.api";
import { queryKeys, STALE_TIME } from "@/lib/constants";

export function useServices(
  params: ServiceListParams = {},
  options: { enabled?: boolean } = {},
) {
  return useQuery({
    queryKey: queryKeys.services.list({ ...params }),
    queryFn: () => servicesApi.list(params),
    placeholderData: keepPreviousData,
    staleTime: STALE_TIME.default,
    enabled: options.enabled ?? true,
  });
}
