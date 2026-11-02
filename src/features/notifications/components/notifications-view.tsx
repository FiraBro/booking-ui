"use client";

import {
  Bell,
  CircleAlert,
  CircleCheck,
  Info,
  TriangleAlert,
  type LucideIcon,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { EmptyState } from "@/components/shared/empty-state";
import { ErrorState } from "@/components/shared/error-state";
import { ListSkeleton } from "@/components/shared/loading-skeleton";
import { Pagination } from "@/components/shared/pagination";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useMarkAllNotificationsRead } from "@/features/notifications/hooks/use-notification-mutations";
import {
  useMarkNotificationRead,
  useNotifications,
} from "@/features/notifications/hooks/use-notifications";
import { formatRelativeTime } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { Notification } from "@/types";

const PAGE_SIZE = 10;

const ICONS: Record<string, LucideIcon> = {
  info: Info,
  success: CircleCheck,
  warning: TriangleAlert,
  error: CircleAlert,
};

const ICON_TONES: Record<string, string> = {
  info: "bg-info/10 text-info",
  success: "bg-success/10 text-success",
  warning: "bg-warning/10 text-warning",
  error: "bg-destructive/10 text-destructive",
};

function isInternalLink(link: string | null | undefined): link is string {
  return (
    typeof link === "string" && link.startsWith("/") && !link.startsWith("//")
  );
}

type Filter = "all" | "unread";

export function NotificationsView() {
  const router = useRouter();
  const [page, setPage] = useState(1);
  const [filter, setFilter] = useState<Filter>("all");
  const query = useNotifications({ page, pageSize: PAGE_SIZE });
  const markRead = useMarkNotificationRead();
  const markAll = useMarkAllNotificationsRead();

  const items = query.data?.items ?? [];
  const unreadIds = items.filter((item) => !item.isRead).map((item) => item.id);
  const visible =
    filter === "unread" ? items.filter((item) => !item.isRead) : items;
  const meta = query.data?.meta;

  function open(notification: Notification) {
    if (!notification.isRead) markRead.mutate(notification.id);
    if (isInternalLink(notification.link)) router.push(notification.link);
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Tabs
          value={filter}
          onValueChange={(next) =>
            setFilter(next === "unread" ? "unread" : "all")
          }
        >
          <TabsList>
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="unread">
              Unread{unreadIds.length > 0 ? ` (${unreadIds.length})` : ""}
            </TabsTrigger>
          </TabsList>
        </Tabs>
        <Button
          variant="outline"
          size="sm"
          disabled={unreadIds.length === 0 || markAll.isPending}
          onClick={() => markAll.mutate(unreadIds)}
        >
          Mark all as read
        </Button>
      </div>

      {query.isPending ? (
        <ListSkeleton rows={5} />
      ) : query.isError && !query.data ? (
        <ErrorState error={query.error} onRetry={() => void query.refetch()} />
      ) : visible.length === 0 ? (
        <EmptyState
          icon={Bell}
          title={
            filter === "unread"
              ? "No unread notifications"
              : "No notifications yet"
          }
          description="We'll let you know when something happens."
        />
      ) : (
        <ul className="divide-y rounded-lg border bg-card">
          {visible.map((notification) => {
            const Icon = ICONS[notification.type] ?? Info;
            return (
              <li key={notification.id}>
                <button
                  type="button"
                  onClick={() => open(notification)}
                  className={cn(
                    "flex w-full items-start gap-3 p-4 text-left transition-colors hover:bg-accent focus-visible:bg-accent focus-visible:outline-none",
                    !notification.isRead && "bg-primary/5",
                  )}
                >
                  <span
                    className={cn(
                      "flex size-9 shrink-0 items-center justify-center rounded-full",
                      ICON_TONES[notification.type] ?? ICON_TONES.info,
                    )}
                  >
                    <Icon className="size-4" aria-hidden />
                  </span>
                  <span className="min-w-0 flex-1 space-y-0.5">
                    <span className="flex items-center gap-2">
                      <span className="truncate text-sm font-medium">
                        {notification.title}
                      </span>
                      {!notification.isRead ? (
                        <>
                          <span
                            aria-hidden
                            className="size-2 shrink-0 rounded-full bg-primary"
                          />
                          <span className="sr-only">Unread</span>
                        </>
                      ) : null}
                    </span>
                    <span className="block text-sm text-muted-foreground">
                      {notification.message}
                    </span>
                    <span className="block text-xs text-muted-foreground">
                      {formatRelativeTime(notification.createdAt)}
                    </span>
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      )}

      {meta ? (
        <div className="flex justify-center">
          <Pagination
            page={meta.page}
            totalPages={meta.totalPages}
            onPageChange={setPage}
            disabled={query.isFetching}
          />
        </div>
      ) : null}
    </div>
  );
}
