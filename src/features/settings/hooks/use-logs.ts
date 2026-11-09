import { keepPreviousData, useQuery } from "@tanstack/react-query";
import {
  settingsApi,
  type LogListParams,
} from "@/features/settings/api/setting.api";
import { queryKeys, STALE_TIME } from "@/lib/constants";

export function useLogs(params: LogListParams = {}) {
  return useQuery({
    queryKey: queryKeys.logs.list({ ...params }),
    queryFn: () => settingsApi.logs(params),
    placeholderData: keepPreviousData,
    staleTime: STALE_TIME.short,
  });
}
