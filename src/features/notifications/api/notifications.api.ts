import { api } from "@/lib/api/client";
import { endpoints } from "@/lib/api/endpoints";
import { notificationSchema } from "@/lib/validations/auth";
import type { ListParams, Notification, PaginatedResponse } from "@/types";

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

export const notificationsApi = { list, markRead };
