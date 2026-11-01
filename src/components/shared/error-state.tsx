import {
  CircleAlert,
  RotateCw,
  SearchX,
  ShieldAlert,
  WifiOff,
  type LucideIcon,
} from "lucide-react";
import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { getErrorMessage, normalizeApiError } from "@/lib/api/error";
import type { ApiErrorKind } from "@/types/api";
import { cn } from "@/lib/utils";

interface ErrorStateProps {
  error?: unknown;
  /** Overrides the title derived from the error kind. */
  title?: string;
  /** Overrides the message derived from the error. */
  message?: ReactNode;
  onRetry?: () => void;
  retryLabel?: string;
  /** Extra actions rendered next to the retry button. */
  action?: ReactNode;
  className?: string;
}

const PRESENTATION: Partial<
  Record<ApiErrorKind, { icon: LucideIcon; title: string }>
> = {
  forbidden: { icon: ShieldAlert, title: "Access denied" },
  not_found: { icon: SearchX, title: "Not found" },
  network: { icon: WifiOff, title: "Connection problem" },
  timeout: { icon: WifiOff, title: "The request timed out" },
};

export function ErrorState({
  error,
  title,
  message,
  onRetry,
  retryLabel = "Try again",
  action,
  className,
}: ErrorStateProps) {
  const kind = error === undefined ? undefined : normalizeApiError(error).kind;
  const presentation = kind ? PRESENTATION[kind] : undefined;
  const Icon = presentation?.icon ?? CircleAlert;
  const resolvedTitle = title ?? presentation?.title ?? "Something went wrong";
  const resolvedMessage =
    message ??
    (error === undefined ? "Please try again." : getErrorMessage(error));
  const canRetry = onRetry && kind !== "forbidden" && kind !== "not_found";

  return (
    <div
      role="alert"
      className={cn(
        "flex flex-col items-center justify-center gap-3 rounded-lg border border-destructive/30 bg-destructive/5 p-8 text-center",
        className,
      )}
    >
      <span className="flex size-12 items-center justify-center rounded-full bg-destructive/10 text-destructive">
        <Icon className="size-6" aria-hidden />
      </span>
      <div className="space-y-1">
        <h3 className="text-base font-semibold">{resolvedTitle}</h3>
        <p className="mx-auto max-w-sm text-sm text-muted-foreground">
          {resolvedMessage}
        </p>
      </div>
      {canRetry || action ? (
        <div className="mt-1 flex flex-wrap items-center justify-center gap-2">
          {canRetry ? (
            <Button variant="outline" size="sm" onClick={onRetry}>
              <RotateCw aria-hidden />
              {retryLabel}
            </Button>
          ) : null}
          {action}
        </div>
      ) : null}
    </div>
  );
}
