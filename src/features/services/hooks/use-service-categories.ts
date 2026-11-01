import { useQuery } from "@tanstack/react-query";
import { servicesApi } from "@/features/services/api/services.api";
import { queryKeys, STALE_TIME } from "@/lib/constants";

export function useServiceCategories() {
  return useQuery({
    queryKey: queryKeys.services.categories,
    queryFn: () => servicesApi.categories(),
    staleTime: STALE_TIME.long,
    meta: { silent: true },
  });
}
