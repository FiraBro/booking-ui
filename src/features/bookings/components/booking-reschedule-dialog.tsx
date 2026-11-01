"use client";

import { startOfToday } from "date-fns";
import { LoaderCircle } from "lucide-react";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { TimeSlotPicker } from "@/features/bookings/components/time-slot-picker";
import { useServiceAvailability } from "@/features/bookings/hooks/use-availability";
import { useUpdateBooking } from "@/features/bookings/hooks/use-booking-mutations";
import { resolveSlots, type ResolvedSlot } from "@/features/bookings/lib/slots";
import {
  formatDateTime,
  formatLongDate,
  fromISODate,
  toISODate,
} from "@/lib/format";
import type { Booking } from "@/types";

interface BookingRescheduleDialogProps {
  booking: Booking;
  onClose: () => void;
}

/** Rendered only while open, so its state is fresh every time. */
export function BookingRescheduleDialog({
  booking,
  onClose,
}: BookingRescheduleDialogProps) {
  const [date, setDate] = useState<string | undefined>();
  const [slot, setSlot] = useState<ResolvedSlot | null>(null);
  const update = useUpdateBooking();

  const serviceId = booking.serviceId ?? booking.service?.id;
  const availability = useServiceAvailability(serviceId, date, booking.staffId);
  const slots = useMemo(
    () => (date ? resolveSlots(date, availability.data) : []),
    [date, availability.data],
  );
  const selectedDate = fromISODate(date) ?? undefined;

  function submit() {
    if (!slot) return;
    update.mutate(
      { id: booking.id, input: { startTime: slot.key } },
      { onSuccess: onClose },
    );
  }

  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open && !update.isPending) onClose();
      }}
    >
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Reschedule booking</DialogTitle>
          <DialogDescription>
            Currently {formatDateTime(booking.startTime)}. Choose a new date and
            time.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 sm:grid-cols-[auto_1fr]">
          <div className="mx-auto rounded-lg border sm:mx-0">
            <Calendar
              mode="single"
              selected={selectedDate}
              defaultMonth={selectedDate}
              disabled={{ before: startOfToday() }}
              onSelect={(next) => {
                if (!next) return;
                setDate(toISODate(next));
                setSlot(null);
              }}
            />
          </div>

          <div className="min-w-0 space-y-3">
            <p className="text-sm font-medium">
              {selectedDate ? formatLongDate(selectedDate) : "Select a date"}
            </p>
            {!serviceId ? (
              <p className="text-sm text-muted-foreground">
                This booking has no service attached, so it can&apos;t be moved.
              </p>
            ) : selectedDate ? (
              <TimeSlotPicker
                slots={slots}
                value={slot?.key ?? null}
                onChange={setSlot}
                isLoading={availability.isPending}
                error={availability.error}
                onRetry={() => void availability.refetch()}
              />
            ) : null}
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={onClose}
            disabled={update.isPending}
          >
            Keep current time
          </Button>
          <Button onClick={submit} disabled={!slot || update.isPending}>
            {update.isPending ? (
              <LoaderCircle className="animate-spin" aria-hidden />
            ) : null}
            Confirm new time
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
