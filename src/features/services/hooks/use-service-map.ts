import { useMemo } from "react";
import { useServices } from "@/features/services/hooks/use-services";
import type { Service } from "@/types";

export function useServiceMap(): Map<string, Service> {
  const query = useServices({ page: 1, pageSize: 100 });
  return useMemo(
    () =>
      new Map(
        (query.data?.items ?? []).map((service) => [service.id, service]),
      ),
    [query.data],
  );
}
