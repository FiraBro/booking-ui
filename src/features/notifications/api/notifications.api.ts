import { usersApi } from "@/features/users/api/users.api";
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

async function sendToAudience(
  input: SendNotificationInput,
  targetRole?: "customer" | "staff" | "admin",
): Promise<{ sent: number; failed: number }> {
  const pageSize = 100;
  const firstPage = await usersApi.list({ page: 1, pageSize });
  const users = [...firstPage.items];

  for (let page = 2; page <= firstPage.meta.totalPages; page += 1) {
    const result = await usersApi.list({ page, pageSize });
    users.push(...result.items);
  }

  const userIds = users
    .filter((user) =>
      !targetRole ||
      user.role === targetRole ||
      (targetRole === "customer" && user.role === "user"),
    )
    .map((user) => user.id);

  let sent = 0;
  let failed = 0;
  for (let index = 0; index < userIds.length; index += 5) {
    const results = await Promise.allSettled(
      userIds.slice(index, index + 5).map((userId) =>
        send({ ...input, userId, role: undefined }),
      ),
    );
    sent += results.filter((result) => result.status === "fulfilled").length;
    failed += results.filter((result) => result.status === "rejected").length;
  }

  return { sent, failed };
}

export const notificationsApi = { list, markRead, send, sendToAudience };
