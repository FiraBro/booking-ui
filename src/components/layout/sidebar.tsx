"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { getNavigation, getActiveNavItem } from "@/config/navigation";
import { getHomeRoute } from "@/config/routes";
import { useRecentNotifications } from "@/features/notifications/hooks/use-notifications";
import { type UserRole } from "@/lib/constants";
import { cn } from "@/lib/utils";

interface SidebarProps {
  role: UserRole;
  onNavigate?: () => void;
}

export function Sidebar({ role, onNavigate }: SidebarProps) {
  const pathname = usePathname();
  const sections = getNavigation(role);
  const activeItem = getActiveNavItem(role, pathname);
  const { unreadCount } = useRecentNotifications();

  return (
    <div className="flex h-full flex-col">
      <div className="flex h-(--topbar-height) shrink-0 items-center border-b px-4">
        <Link
          href={getHomeRoute(role)}
          onClick={onNavigate}
          aria-label="Eventify home"
          className="flex items-center"
        >
          <Image
            src="/brand/eventify-logo.png"
            alt="Eventify"
            width={108}
            height={36}
            unoptimized
            priority
            className="h-8 w-auto object-contain"
          />
        </Link>
      </div>

      <nav
        aria-label="Main navigation"
        className="flex-1 space-y-6 overflow-y-auto p-3"
      >
        {sections.map((section, index) => (
          <div key={section.label ?? `section-${index}`}>
            {section.label ? (
              <p className="px-3 pb-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                {section.label}
              </p>
            ) : null}
            <ul className="space-y-1">
              {section.items.map((item) => {
                const isActive = activeItem?.href === item.href;
                const Icon = item.icon;
                const showBadge =
                  item.badge === "notifications" && unreadCount > 0;

                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      onClick={onNavigate}
                      aria-current={isActive ? "page" : undefined}
                      className={cn(
                        "relative flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors duration-200 after:absolute after:inset-x-3 after:bottom-1 after:h-px after:origin-left after:bg-primary after:transition-transform after:duration-200",
                        isActive
                          ? "bg-primary text-primary-foreground after:scale-x-0"
                          : "text-muted-foreground after:scale-x-0 hover:text-primary hover:after:scale-x-100",
                      )}
                    >
                      <Icon className="size-4 shrink-0" aria-hidden />
                      <span className="flex-1 truncate">{item.title}</span>
                      {showBadge ? (
                        <span
                          className={cn(
                            "inline-flex min-w-5 items-center justify-center rounded-full px-1.5 py-0.5 text-[11px] font-semibold leading-none",
                            isActive
                              ? "bg-primary-foreground text-primary"
                              : "bg-primary text-primary-foreground",
                          )}
                        >
                          <span aria-hidden>
                            {unreadCount > 9 ? "9+" : unreadCount}
                          </span>
                          <span className="sr-only">{unreadCount} unread</span>
                        </span>
                      ) : null}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>
    </div>
  );
}
