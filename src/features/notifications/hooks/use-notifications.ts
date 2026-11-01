import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { notificationsApi } from "@/features/notifications/api/notifications.api";
import {
  NOTIFICATION_POLL_INTERVAL_MS,
  queryKeys,
  STALE_TIME,
} from "@/lib/constants";
import type { ListParams, Notification, PaginatedResponse } from "@/types";

const RECENT_PARAMS: ListParams = { page: 1, pageSize: 20 };

export function useNotifications(params: ListParams = {}) {
  return useQuery({
    queryKey: queryKeys.notifications.list({ ...params }),
    queryFn: () => notificationsApi.list(params),
    refetchInterval: NOTIFICATION_POLL_INTERVAL_MS,
    staleTime: STALE_TIME.short,
    meta: { silent: true },
  });
}

/** Shared by the topbar bell and the sidebar badge, so both read one cached request. */
export function useRecentNotifications() {
  const query = useNotifications(RECENT_PARAMS);
  const items = query.data?.items ?? [];
  const unreadCount = items.filter((item) => !item.isRead).length;

  return {
    items,
    unreadCount,
    isPending: query.isPending,
    isError: query.isError,
    refetch: query.refetch,
  };
}

type NotificationPage = PaginatedResponse<Notification>;

export function useMarkNotificationRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => notificationsApi.markRead(id),
    meta: { silent: true },
    onMutate: async (id) => {
      await queryClient.cancelQueries({
        queryKey: queryKeys.notifications.all,
      });
      const snapshots = queryClient.getQueriesData<NotificationPage>({
        queryKey: queryKeys.notifications.all,
      });
      queryClient.setQueriesData<NotificationPage>(
        { queryKey: queryKeys.notifications.all },
        (old) =>
          old
            ? {
                ...old,
                items: old.items.map((item) =>
                  item.id === id ? { ...item, isRead: true } : item,
                ),
              }
            : old,
      );
      return { snapshots };
    },
    onError: (_error, _id, context) => {
      context?.snapshots.forEach(([key, data]) =>
        queryClient.setQueryData(key, data),
      );
    },
    onSettled: () => {
      void queryClient.invalidateQueries({
        queryKey: queryKeys.notifications.all,
      });
    },
  });
}
