import { useQuery } from "@tanstack/react-query";
import { servicesApi } from "@/features/services/api/services.api";

import { queryKeys, STALE_TIME } from "@/lib/constants";

export function useService(id: string | undefined) {
  return useQuery({
    queryKey: queryKeys.services.detail(id ?? ""),
    queryFn: () => servicesApi.get(id as string),
    enabled: Boolean(id),
    staleTime: STALE_TIME.default,
  });
}
