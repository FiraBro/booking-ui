"use client";

import { Menu } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { type ReactNode, useSyncExternalStore } from "react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { getHomeRoute, ROUTES } from "@/config/routes";
import { COOKIE_NAMES, parseUserRole } from "@/lib/constants";

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

type Role = ReturnType<typeof parseUserRole>;

function AuthActions({
  role,
  variant,
}: {
  role: Role;
  variant: "bar" | "drawer";
}) {
  const inDrawer = variant === "drawer";
  const size = inDrawer ? "default" : "sm";
  const wrap = (node: ReactNode) =>
    inDrawer ? <SheetClose asChild>{node}</SheetClose> : node;

  if (role) {
    return wrap(
      <Button asChild size={size}>
        <Link href={getHomeRoute(role)}>Dashboard</Link>
      </Button>,
    );
  }

  return (
    <>
      {wrap(
        <Button asChild variant="ghost" size={size}>
          <Link href={ROUTES.login}>Sign in</Link>
        </Button>,
      )}
      {wrap(
        <Button
          asChild
          size={size}
          className={inDrawer ? undefined : "hidden sm:inline-flex"}
        >
          <Link href={ROUTES.register}>Get started</Link>
        </Button>,
      )}
    </>
  );
}

export function PublicHeader() {
  // The server snapshot is "" so the first paint matches the server output, then the cookie is read.
  const role = parseUserRole(
    useSyncExternalStore(subscribe, readRoleCookie, () => ""),
  );

  return (
    <header className="sticky top-0 z-20 border-b border-border/70 bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/70">
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

        <div className="ml-auto flex items-center gap-2">
          <AuthActions role={role} variant="bar" />

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
              <nav aria-label="Mobile" className="grid gap-4 px-4">
                <div className="grid gap-2 border-t pt-4">
                  <AuthActions role={role} variant="drawer" />
                </div>
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
