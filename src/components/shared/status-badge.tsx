import { Badge } from "@/components/ui/badge";
import {
  BOOKING_STATUS_LABELS,
  PAYMENT_STATUS_LABELS,
  type BookingStatus,
  type PaymentStatus,
} from "@/lib/constants";
import { humanize } from "@/lib/format";
import { cn } from "@/lib/utils";

export type StatusTone =
  | "success"
  | "warning"
  | "info"
  | "danger"
  | "neutral"
  | "muted";
export type StatusKind = "booking" | "payment" | "generic";

const TONE_CLASSES: Record<StatusTone, string> = {
  success: "border-success/30 bg-success/10 text-success",
  warning: "border-warning/30 bg-warning/10 text-warning",
  info: "border-info/30 bg-info/10 text-info",
  danger: "border-destructive/30 bg-destructive/10 text-destructive",
  neutral: "border-border bg-secondary text-secondary-foreground",
  muted: "border-border bg-muted text-muted-foreground",
};

const BOOKING_TONES: Record<BookingStatus, StatusTone> = {
  pending: "warning",
  confirmed: "info",
  in_progress: "info",
  completed: "success",
  cancelled: "danger",
  no_show: "muted",
  refunded: "neutral",
};

const PAYMENT_TONES: Record<PaymentStatus, StatusTone> = {
  unpaid: "muted",
  pending: "warning",
  paid: "success",
  failed: "danger",
  refunded: "neutral",
  partially_refunded: "neutral",
};

const GENERIC_TONES: Record<string, StatusTone> = {
  active: "success",
  inactive: "muted",
  enabled: "success",
  disabled: "muted",
  error: "danger",
  warning: "warning",
  info: "info",
  success: "success",
};

function normalize(status: string): string {
  return status
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, "_");
}

function resolve(
  status: string,
  kind: StatusKind,
): { tone: StatusTone; label: string } {
  const key = normalize(status);
  if (kind === "booking" && key in BOOKING_TONES) {
    return {
      tone: BOOKING_TONES[key as BookingStatus],
      label: BOOKING_STATUS_LABELS[key as BookingStatus],
    };
  }
  if (kind === "payment" && key in PAYMENT_TONES) {
    return {
      tone: PAYMENT_TONES[key as PaymentStatus],
      label: PAYMENT_STATUS_LABELS[key as PaymentStatus],
    };
  }
  return { tone: GENERIC_TONES[key] ?? "neutral", label: humanize(key) };
}

interface StatusBadgeProps {
  status: string | null | undefined;
  kind?: StatusKind;
  /** Overrides the tone derived from the status. */
  tone?: StatusTone;
  /** Overrides the label derived from the status. */
  label?: string;
  className?: string;
}

export function StatusBadge({
  status,
  kind = "generic",
  tone,
  label,
  className,
}: StatusBadgeProps) {
  if (!status) {
    return (
      <Badge variant="outline" className={cn(TONE_CLASSES.muted, className)}>
        —
      </Badge>
    );
  }

  const resolved = resolve(status, kind);

  return (
    <Badge
      variant="outline"
      className={cn(
        "gap-1.5 font-medium",
        TONE_CLASSES[tone ?? resolved.tone],
        className,
      )}
    >
      <span aria-hidden className="size-1.5 shrink-0 rounded-full bg-current" />
      {label ?? resolved.label}
    </Badge>
  );
}
