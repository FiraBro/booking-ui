"use client";

import { Bell } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Skeleton } from "@/components/ui/skeleton";
import { getNotificationsRoute } from "@/config/routes";
import {
  useMarkNotificationRead,
  useRecentNotifications,
} from "@/features/notifications/hooks/use-notifications";
import { formatRelativeTime } from "@/lib/format";
import type { UserRole } from "@/lib/constants";
import { cn } from "@/lib/utils";
import type { Notification } from "@/types";

function isInternalLink(link: string | null | undefined): link is string {
  return typeof link === "string" && link.startsWith("/") && !link.startsWith("//");
}

export function NotificationsMenu({ role }: { role: UserRole }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const { items, unreadCount, isPending, isError, refetch } = useRecentNotifications();
  const markRead = useMarkNotificationRead();
  const recent = items.slice(0, 6);

  function handleSelect(notification: Notification) {
    const { link } = notification;
    if (!notification.isRead) markRead.mutate(notification.id);
    setOpen(false);
    if (isInternalLink(link)) router.push(link);
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative"
          aria-label={unreadCount > 0 ? `Notifications, ${unreadCount} unread` : "Notifications"}
        >
          <Bell className="size-5" aria-hidden />
          {unreadCount > 0 ? (
            <span
              aria-hidden
              className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-semibold leading-none text-white"
            >
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          ) : null}
        </Button>
      </PopoverTrigger>

      <PopoverContent align="end" className="w-88 max-w-[calc(100vw-2rem)] p-0">
        <div className="flex items-center justify-between border-b px-4 py-3">
          <h2 className="text-sm font-semibold">Notifications</h2>
          {unreadCount > 0 ? <span className="text-xs text-muted-foreground">{unreadCount} unread</span> : null}
        </div>

        <div className="max-h-96 overflow-y-auto">
          {isPending ? (
            <div className="space-y-3 p-4">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : isError ? (
            <div className="space-y-3 p-4 text-center text-sm">
              <p className="text-muted-foreground">We couldn&apos;t load your notifications.</p>
              <Button variant="outline" size="sm" onClick={() => void refetch()}>
                Try again
              </Button>
            </div>
          ) : recent.length === 0 ? (
            <p className="p-6 text-center text-sm text-muted-foreground">You&apos;re all caught up.</p>
          ) : (
            <ul className="divide-y">
              {recent.map((notification) => (
                <li key={notification.id}>
                  <button
                    type="button"
                    onClick={() => handleSelect(notification)}
                    className={cn(
                      "flex w-full gap-3 px-4 py-3 text-left text-sm transition-colors hover:bg-accent focus-visible:bg-accent focus-visible:outline-none",
                      !notification.isRead && "bg-primary/5",
                    )}
                  >
                    <span
                      aria-hidden
                      className={cn(
                        "mt-1.5 size-2 shrink-0 rounded-full",
                        notification.isRead ? "bg-transparent" : "bg-primary",
                      )}
                    />
                    <span className="min-w-0 flex-1">
                      {!notification.isRead ? <span className="sr-only">Unread. </span> : null}
                      <span className="block truncate font-medium">{notification.title}</span>
                      <span className="line-clamp-2 text-muted-foreground">{notification.message}</span>
                      <span className="mt-1 block text-xs text-muted-foreground">
                        {formatRelativeTime(notification.createdAt)}
                      </span>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="border-t p-2">
          <Button asChild variant="ghost" size="sm" className="w-full">
            <Link href={getNotificationsRoute(role)} onClick={() => setOpen(false)}>
              View all notifications
            </Link>
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
