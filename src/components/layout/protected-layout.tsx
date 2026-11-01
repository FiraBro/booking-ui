"use client";

import { CircleAlert } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, type ReactNode } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { getHomeRoute, ROUTES } from "@/config/routes";
import { useLogout } from "@/features/auth/hooks/use-logout";
import { useProfile } from "@/features/auth/hooks/use-profile";
import { getErrorMessage, isApiError } from "@/lib/api/error";
import type { UserRole } from "@/lib/constants";

interface ProtectedLayoutProps {
  allowedRoles: readonly UserRole[];
  children: ReactNode;
}

function ShellSkeleton() {
  return (
    <div className="min-h-screen" aria-busy="true">
      <span className="sr-only" role="status">
        Loading your workspace…
      </span>
      <div className="fixed inset-y-0 left-0 hidden w-(--sidebar-width) space-y-3 border-r p-4 lg:block">
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-9 w-full" />
        <Skeleton className="h-9 w-full" />
        <Skeleton className="h-9 w-full" />
        <Skeleton className="h-9 w-full" />
      </div>
      <div className="lg:pl-(--sidebar-width)">
        <div className="h-(--topbar-height) border-b" />
        <div className="space-y-4 p-6">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
        </div>
      </div>
    </div>
  );
}

export function ProtectedLayout({
  allowedRoles,
  children,
}: ProtectedLayoutProps) {
  const router = useRouter();
  const pathname = usePathname();
  const logout = useLogout();
  const { data: user, isError, error, refetch } = useProfile();

  const unauthorized =
    isError && isApiError(error) && error.kind === "unauthorized";
  const roleAllowed = user ? allowedRoles.includes(user.role) : false;

  useEffect(() => {
    if (unauthorized) {
      router.replace(
        `${ROUTES.login}?redirect=${encodeURIComponent(pathname)}`,
      );
    }
  }, [unauthorized, pathname, router]);

  useEffect(() => {
    if (user && !allowedRoles.includes(user.role)) {
      router.replace(getHomeRoute(user.role));
    }
  }, [user, allowedRoles, router]);

  if (isError && !unauthorized) {
    return (
      <div className="flex min-h-screen items-center justify-center p-6">
        <div className="w-full max-w-md space-y-4">
          <Alert variant="destructive">
            <CircleAlert aria-hidden />
            <AlertTitle>We couldn&apos;t load your account</AlertTitle>
            <AlertDescription>{getErrorMessage(error)}</AlertDescription>
          </Alert>
          <div className="flex gap-2">
            <Button onClick={() => void refetch()}>Try again</Button>
            <Button
              variant="outline"
              onClick={() => logout.mutate()}
              disabled={logout.isPending}
            >
              Sign out
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (!user || !roleAllowed) return <ShellSkeleton />;

  return <AppShell user={user}>{children}</AppShell>;
}
