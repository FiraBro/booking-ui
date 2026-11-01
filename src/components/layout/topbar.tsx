"use client";

import { CalendarPlus, Menu } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { NotificationsMenu } from "@/components/layout/notifications-menu";
import { UserMenu } from "@/components/layout/user-menu";
import { Button } from "@/components/ui/button";
import { getActiveNavItem } from "@/config/navigation";
import { ROUTES } from "@/config/routes";
import type { User } from "@/types";

interface TopbarProps {
  user: User;
  onOpenNavigation: () => void;
}

export function Topbar({ user, onOpenNavigation }: TopbarProps) {
  const pathname = usePathname();
  const activeItem = getActiveNavItem(user.role, pathname);

  return (
    <header
      data-topbar
      className="sticky top-0 z-20 flex h-(--topbar-height) items-center gap-2 border-b bg-background/95 px-4 backdrop-blur supports-[backdrop-filter]:bg-background/60 sm:px-6"
    >
      <Button
        variant="ghost"
        size="icon"
        className="lg:hidden"
        onClick={onOpenNavigation}
        aria-label="Open navigation menu"
      >
        <Menu className="size-5" aria-hidden />
      </Button>

      <p className="min-w-0 flex-1 truncate text-sm font-medium">
        {activeItem?.title ?? ""}
      </p>

      {user.role === "customer" ? (
        <Button asChild size="sm" className="hidden sm:inline-flex">
          <Link href={ROUTES.customer.newBooking}>
            <CalendarPlus aria-hidden />
            Book now
          </Link>
        </Button>
      ) : null}

      <NotificationsMenu role={user.role} />
      <UserMenu user={user} />
    </header>
  );
}
