import { api } from "@/lib/api/client";
import { endpoints } from "@/lib/api/endpoints";
import { removeEmptyValues } from "@/lib/utils";
import { notificationSchema } from "@/lib/validations/auth";
import type {
  ListParams,
  Notification,
  PaginatedResponse,
  SendNotificationInput,
} from "@/types";

async function list(
  params: ListParams = {},
): Promise<PaginatedResponse<Notification>> {
  return api.getPaginated<Notification>(
    endpoints.notifications.list,
    notificationSchema,
    { ...params },
  );
}

async function markRead(id: string): Promise<void> {
  await api.patch<unknown>(endpoints.notifications.read(id));
}

/** POST /notifications/send (admin). Leave `userId` and `role` empty to broadcast to everyone. */
async function send(input: SendNotificationInput): Promise<void> {
  await api.post<unknown>(
    endpoints.notifications.send,
    removeEmptyValues({ ...input }),
  );
}

export const notificationsApi = { list, markRead, send };
