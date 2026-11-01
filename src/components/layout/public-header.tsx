"use client";

import { CalendarCheck } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSyncExternalStore } from "react";
import { Button } from "@/components/ui/button";
import { PUBLIC_NAV } from "@/config/navigation";
import { getHomeRoute, ROUTES } from "@/config/routes";
import { APP_NAME, COOKIE_NAMES, parseUserRole } from "@/lib/constants";
import { cn } from "@/lib/utils";

function subscribe(): () => void {
  return () => undefined;
}

function readRoleCookie(): string {
  const entry = document.cookie
    .split("; ")
    .find((cookie) => cookie.startsWith(`${COOKIE_NAMES.role}=`));
  return entry
    ? decodeURIComponent(entry.slice(COOKIE_NAMES.role.length + 1))
    : "";
}

export function PublicHeader() {
  const pathname = usePathname();
  // The server snapshot is "" so the first paint matches the server output, then the cookie is read.
  const role = parseUserRole(
    useSyncExternalStore(subscribe, readRoleCookie, () => ""),
  );

  return (
    <header className="sticky top-0 z-20 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto flex h-16 max-w-6xl items-center gap-4 px-4 sm:px-6">
        <Link
          href={ROUTES.home}
          className="flex items-center gap-2 text-base font-semibold"
        >
          <span className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <CalendarCheck className="size-4" aria-hidden />
          </span>
          {APP_NAME}
        </Link>

        <nav aria-label="Primary" className="flex flex-1 items-center gap-1">
          {PUBLIC_NAV.map((item) => {
            const active =
              item.href === ROUTES.home
                ? pathname === item.href
                : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-accent",
                  active ? "text-foreground" : "text-muted-foreground",
                )}
              >
                {item.title}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-2">
          {role ? (
            <Button asChild size="sm">
              <Link href={getHomeRoute(role)}>Dashboard</Link>
            </Button>
          ) : (
            <>
              <Button asChild variant="ghost" size="sm">
                <Link href={ROUTES.login}>Sign in</Link>
              </Button>
              <Button asChild size="sm" className="hidden sm:inline-flex">
                <Link href={ROUTES.register}>Get started</Link>
              </Button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
