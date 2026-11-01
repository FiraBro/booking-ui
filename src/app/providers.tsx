"use client";

import {
  MutationCache,
  QueryCache,
  QueryClient,
  QueryClientProvider,
  useQueryClient,
} from "@tanstack/react-query";
import { ThemeProvider } from "next-themes";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { toast } from "sonner";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { isProtectedPath, ROUTES } from "@/config/routes";
import { subscribeSessionExpired } from "@/lib/api/client";
import { getErrorMessage, isApiError, normalizeApiError } from "@/lib/api/error";
import { STALE_TIME } from "@/lib/constants";

const NON_RETRYABLE_KINDS = new Set([
  "unauthorized",
  "forbidden",
  "not_found",
  "validation",
  "bad_request",
  "conflict",
  "cancelled",
  "schema",
]);

function shouldRetry(failureCount: number, error: unknown): boolean {
  if (isApiError(error) && NON_RETRYABLE_KINDS.has(error.kind)) return false;
  return failureCount < 2;
}

/**
 * Global error handling:
 *  - Queries: toast only for failed background refetches (the UI already shows an ErrorState otherwise).
 *    Set `meta: { silent: true }` to opt out.
 *  - Mutations: toast every failure except validation/auth/cancel errors, which forms and the session
 *    listener handle inline. Set `meta: { silent: true }` to opt out.
 */
function createQueryClient(): QueryClient {
  return new QueryClient({
    queryCache: new QueryCache({
      onError: (error, query) => {
        if (isApiError(error) && error.kind === "forbidden") {
          toast.error(error.message, { id: "forbidden" });
          return;
        }
        if (query.meta?.silent) return;
        if (query.state.data !== undefined) toast.error(getErrorMessage(error));
      },
    }),
    mutationCache: new MutationCache({
      onError: (error, _variables, _context, mutation) => {
        if (mutation.meta?.silent) return;
        const normalized = normalizeApiError(error);
        if (["validation", "unauthorized", "cancelled"].includes(normalized.kind)) return;
        toast.error(normalized.message);
      },
    }),
    defaultOptions: {
      queries: {
        staleTime: STALE_TIME.default,
        gcTime: 5 * 60_000,
        retry: shouldRetry,
        refetchOnWindowFocus: false,
      },
      mutations: {
        retry: false,
      },
    },
  });
}

function SessionExpiryListener() {
  const router = useRouter();
  const pathname = usePathname();
  const queryClient = useQueryClient();

  useEffect(() => {
    return subscribeSessionExpired(() => {
      queryClient.clear();
      if (!isProtectedPath(pathname)) return;
      const redirect = `?redirect=${encodeURIComponent(pathname)}`;
      toast.info("Your session has expired. Please sign in again.", { id: "session-expired" });
      router.replace(`${ROUTES.login}${redirect}`);
    });
  }, [pathname, queryClient, router]);

  return null;
}

export function Providers({ children }: { children: ReactNode }) {
  const [queryClient] = useState(createQueryClient);

  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <SessionExpiryListener />
          {children}
          <Toaster richColors closeButton position="top-right" />
        </TooltipProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
}