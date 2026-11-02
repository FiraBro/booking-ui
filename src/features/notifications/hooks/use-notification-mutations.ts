import { useMutation, useQueryClient } from "@tanstack/react-query";
import { notify } from "@/components/shared/toast";
import { notificationsApi } from "@/features/notifications/api/notifications.api";
import { queryKeys } from "@/lib/constants";
import type { SendNotificationInput } from "@/types";

export function useSendNotification() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: SendNotificationInput) => notificationsApi.send(input),
    onSuccess: () => {
      notify.success("Notification sent");
      void queryClient.invalidateQueries({
        queryKey: queryKeys.notifications.all,
      });
    },
  });
}

/** There is no bulk endpoint, so each unread notification is marked individually. */
export function useMarkAllNotificationsRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (ids: string[]) => {
      await Promise.allSettled(ids.map((id) => notificationsApi.markRead(id)));
    },
    meta: { silent: true },
    onSettled: () => {
      void queryClient.invalidateQueries({
        queryKey: queryKeys.notifications.all,
      });
    },
  });
}
