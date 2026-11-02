import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { usersApi, type UserListParams } from "@/features/users/api/users.api";
import { queryKeys, STALE_TIME } from "@/lib/constants";

export function useUsers(params: UserListParams = {}) {
  return useQuery({
    queryKey: queryKeys.users.list({ ...params }),
    queryFn: () => usersApi.list(params),
    placeholderData: keepPreviousData,
    staleTime: STALE_TIME.short,
  });
}

export function useUser(id: string | undefined) {
  return useQuery({
    queryKey: queryKeys.users.detail(id ?? ""),
    queryFn: () => usersApi.get(id as string),
    enabled: Boolean(id),
    staleTime: STALE_TIME.short,
  });
}
