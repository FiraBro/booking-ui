"use client";

import { Menu } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSyncExternalStore } from "react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { getBookingsRoute, getHomeRoute, ROUTES } from "@/config/routes";
import { COOKIE_NAMES, parseUserRole } from "@/lib/constants";
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

function isActivePath(pathname: string, href: string): boolean {
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function PublicHeader() {
  const pathname = usePathname();
  // The server snapshot is "" so the first paint matches the server output, then the cookie is read.
  const role = parseUserRole(
    useSyncExternalStore(subscribe, readRoleCookie, () => ""),
  );
  const links = [
    { title: "Explore services", href: ROUTES.services },
    {
      title: "My bookings",
      href: role ? getBookingsRoute(role) : ROUTES.customer.bookings,
    },
  ];

  return (
    <header className="sticky top-0 z-20 border-b border-border/70 bg-background">
      <div className="mx-auto flex h-16 max-w-6xl items-center gap-3 px-4 sm:gap-6 sm:px-6">
        <Link
          href={ROUTES.home}
          aria-label="Eventify home"
          className="flex shrink-0 items-center"
        >
          <Image
            src="/brand/eventify-logo.png"
            alt="Eventify"
            width={108}
            height={36}
            unoptimized
            priority
            className="h-8 w-auto object-contain sm:h-9"
          />
        </Link>

        <nav
          aria-label="Primary"
          className="hidden flex-1 items-center gap-1 md:flex"
        >
          {links.map((item) => {
            const active = isActivePath(pathname, item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "relative rounded-md px-3 py-2 text-sm font-medium transition-colors duration-200 hover:text-primary after:absolute after:inset-x-3 after:bottom-1 after:h-px after:origin-left after:bg-primary after:transition-transform after:duration-200",
                  active
                    ? "text-primary after:scale-x-100"
                    : "text-muted-foreground after:scale-x-0 hover:after:scale-x-100",
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
                <Link
                  href={ROUTES.login}
                  className="transition-colors duration-200 hover:text-primary"
                >
                  Sign in
                </Link>
              </Button>
              <Button
                asChild
                size="sm"
                className="hidden rounded-md bg-primary transition-colors duration-200 hover:bg-primary/90 sm:inline-flex"
              >
                <Link href={ROUTES.register}>Get started</Link>
              </Button>
            </>
          )}
          <Sheet>
            <SheetTrigger asChild>
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="md:hidden"
                aria-label="Open navigation menu"
              >
                <Menu className="size-4" aria-hidden />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[min(20rem,85vw)]">
              <SheetHeader>
                <SheetTitle>Explore Eventify</SheetTitle>
              </SheetHeader>
              <nav aria-label="Mobile" className="grid gap-1 px-4">
                {links.map((item) => (
                  <SheetClose asChild key={item.href}>
                    <Link
                      href={item.href}
                      aria-current={
                        isActivePath(pathname, item.href) ? "page" : undefined
                      }
                      className={cn(
                        "rounded-md px-3 py-3 text-sm font-medium transition-colors duration-200 hover:bg-muted hover:text-primary",
                        isActivePath(pathname, item.href) &&
                          "bg-muted text-primary",
                      )}
                    >
                      {item.title}
                    </Link>
                  </SheetClose>
                ))}
                {role ? (
                  <SheetClose asChild>
                    <Link
                      href={getHomeRoute(role)}
                      className="rounded-md px-3 py-3 text-sm font-medium transition-colors duration-200 hover:bg-muted hover:text-primary"
                    >
                      Dashboard
                    </Link>
                  </SheetClose>
                ) : (
                  <div className="mt-2 grid grid-cols-2 gap-2 border-t pt-4">
                    <SheetClose asChild>
                      <Button
                        asChild
                        variant="ghost"
                        className="transition-colors duration-200 hover:text-primary"
                      >
                        <Link href={ROUTES.login}>Log in</Link>
                      </Button>
                    </SheetClose>
                    <SheetClose asChild>
                      <Button
                        asChild
                        className="rounded-md bg-primary transition-colors duration-200 hover:bg-primary/90"
                      >
                        <Link href={ROUTES.register}>Get started</Link>
                      </Button>
                    </SheetClose>
                  </div>
                )}
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
