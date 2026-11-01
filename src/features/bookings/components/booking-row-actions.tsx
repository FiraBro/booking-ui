"use client";

import {
  CalendarClock,
  CircleCheck,
  CircleX,
  Ellipsis,
  Eye,
  Play,
  UserX,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { BookingRescheduleDialog } from "@/features/bookings/components/booking-reschedule-dialog";
import {
  useCancelBooking,
  useUpdateBookingStatus,
} from "@/features/bookings/hooks/use-booking-mutations";
import {
  BOOKING_STATUS_TRANSITIONS,
  CUSTOMER_MODIFIABLE_STATUSES,
  type BookingStatus,
  type UserRole,
} from "@/lib/constants";
import { formatDateTime, toDate } from "@/lib/format";
import type { Booking } from "@/types";

interface StatusActionMeta {
  label: string;
  icon: LucideIcon;
  destructive?: boolean;
}

const STATUS_ACTIONS: Partial<Record<BookingStatus, StatusActionMeta>> = {
  confirmed: { label: "Confirm", icon: CircleCheck },
  in_progress: { label: "Start", icon: Play },
  completed: { label: "Mark completed", icon: CircleCheck },
  cancelled: { label: "Cancel booking", icon: CircleX, destructive: true },
  no_show: { label: "Mark as no-show", icon: UserX, destructive: true },
};

/** Statuses in which staff and admins may still move a booking to another time. */
const STAFF_RESCHEDULABLE: readonly BookingStatus[] = ["pending", "confirmed"];

type PendingAction = BookingStatus | "customer_cancel";

interface ActionEntry {
  key: string;
  label: string;
  icon: LucideIcon;
  destructive?: boolean;
  onSelect: () => void;
}

function startsInFuture(value: string): boolean {
  const date = toDate(value);
  return date ? date.getTime() > Date.now() : false;
}

interface BookingRowActionsProps {
  booking: Booking;
  role: UserRole;
  /** "menu" renders a compact dropdown for table rows, "buttons" an inline row for detail pages. */
  layout?: "menu" | "buttons";
  /** Adds a "View details" item to the menu. */
  detailHref?: string | null;
}

export function BookingRowActions({
  booking,
  role,
  layout = "menu",
  detailHref,
}: BookingRowActionsProps) {
  const updateStatus = useUpdateBookingStatus();
  const cancelBooking = useCancelBooking();
  const [pending, setPending] = useState<PendingAction | null>(null);
  const [reason, setReason] = useState("");
  const [rescheduleOpen, setRescheduleOpen] = useState(false);

  const isCustomer = role === "customer";
  const customerCanModify =
    isCustomer &&
    CUSTOMER_MODIFIABLE_STATUSES.includes(booking.status) &&
    startsInFuture(booking.startTime);
  const canReschedule = isCustomer
    ? customerCanModify
    : STAFF_RESCHEDULABLE.includes(booking.status);
  const transitions: readonly BookingStatus[] = isCustomer
    ? []
    : BOOKING_STATUS_TRANSITIONS[booking.status];
  const busy = updateStatus.isPending || cancelBooking.isPending;

  function runStatus(status: BookingStatus) {
    if (STATUS_ACTIONS[status]?.destructive) {
      setReason("");
      setPending(status);
      return;
    }
    updateStatus.mutate({ id: booking.id, status });
  }

  function confirmPending() {
    if (!pending) return;
    const trimmed = reason.trim() || undefined;
    const close = () => setPending(null);
    if (pending === "customer_cancel") {
      cancelBooking.mutate(
        { id: booking.id, reason: trimmed },
        { onSettled: close },
      );
    } else {
      updateStatus.mutate(
        { id: booking.id, status: pending, reason: trimmed },
        { onSettled: close },
      );
    }
  }

  const entries: ActionEntry[] = [];
  if (canReschedule) {
    entries.push({
      key: "reschedule",
      label: "Reschedule",
      icon: CalendarClock,
      onSelect: () => setRescheduleOpen(true),
    });
  }
  for (const status of transitions) {
    const meta = STATUS_ACTIONS[status];
    if (!meta) continue;
    entries.push({
      key: status,
      label: meta.label,
      icon: meta.icon,
      destructive: meta.destructive,
      onSelect: () => runStatus(status),
    });
  }
  if (customerCanModify) {
    entries.push({
      key: "cancel",
      label: "Cancel booking",
      icon: CircleX,
      destructive: true,
      onSelect: () => {
        setReason("");
        setPending("customer_cancel");
      },
    });
  }

  const isNoShow = pending === "no_show";
  const dialogs = (
    <>
      <ConfirmDialog
        open={pending !== null}
        onOpenChange={(open) => {
          if (!open) setPending(null);
        }}
        title={isNoShow ? "Mark as no-show?" : "Cancel this booking?"}
        description={`${booking.service?.name ?? "Booking"} on ${formatDateTime(booking.startTime)}.`}
        confirmLabel={isNoShow ? "Mark as no-show" : "Cancel booking"}
        cancelLabel="Keep booking"
        variant="destructive"
        loading={busy}
        onConfirm={confirmPending}
      >
        <div className="space-y-2">
          <Label htmlFor={`reason-${booking.id}`}>Reason (optional)</Label>
          <Textarea
            id={`reason-${booking.id}`}
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            maxLength={500}
            rows={3}
          />
        </div>
      </ConfirmDialog>
      {rescheduleOpen ? (
        <BookingRescheduleDialog
          booking={booking}
          onClose={() => setRescheduleOpen(false)}
        />
      ) : null}
    </>
  );

  if (layout === "buttons") {
    if (entries.length === 0) {
      return (
        <p className="text-sm text-muted-foreground">
          No actions are available for this booking.
        </p>
      );
    }
    return (
      <>
        <div className="flex flex-wrap gap-2">
          {entries.map((entry) => {
            const Icon = entry.icon;
            return (
              <Button
                key={entry.key}
                size="sm"
                variant="outline"
                className={
                  entry.destructive
                    ? "text-destructive hover:text-destructive"
                    : undefined
                }
                disabled={busy}
                onClick={entry.onSelect}
              >
                <Icon aria-hidden />
                {entry.label}
              </Button>
            );
          })}
        </div>
        {dialogs}
      </>
    );
  }

  if (!detailHref && entries.length === 0) return null;

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="size-8"
            aria-label={`Actions for booking ${booking.reference ?? booking.id}`}
            disabled={busy}
          >
            <Ellipsis aria-hidden />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-52">
          {detailHref ? (
            <DropdownMenuItem asChild>
              <Link href={detailHref}>
                <Eye aria-hidden />
                View details
              </Link>
            </DropdownMenuItem>
          ) : null}
          {detailHref && entries.length > 0 ? <DropdownMenuSeparator /> : null}
          {entries.map((entry) => {
            const Icon = entry.icon;
            return (
              <DropdownMenuItem
                key={entry.key}
                className={
                  entry.destructive
                    ? "text-destructive focus:text-destructive"
                    : undefined
                }
                onSelect={entry.onSelect}
              >
                <Icon aria-hidden />
                {entry.label}
              </DropdownMenuItem>
            );
          })}
        </DropdownMenuContent>
      </DropdownMenu>
      {dialogs}
    </>
  );
}
