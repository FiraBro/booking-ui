import { useMutation, useQueryClient } from "@tanstack/react-query";
import { notify } from "@/components/shared/toast";
import { notificationsApi } from "@/features/notifications/api/notifications.api";
import { queryKeys } from "@/lib/constants";
import type { SendNotificationInput } from "@/types";

export function useSendNotification() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ input, audience, userId }: {
      input: SendNotificationInput;
      audience: "all" | "customer" | "staff" | "admin" | "user";
      userId?: string;
    }) =>
      audience === "user"
        ? notificationsApi.send({ ...input, userId })
        : notificationsApi.sendToAudience(
            input,
            audience === "all" ? undefined : audience,
          ),
    onSuccess: (result) => {
      if (result && result.failed > 0) {
        notify.warning(
          `Sent to ${result.sent} users; ${result.failed} failed`,
        );
      } else if (result) {
        notify.success(`Notification sent to ${result.sent} users`);
      } else {
        notify.success("Notification sent");
      }
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
