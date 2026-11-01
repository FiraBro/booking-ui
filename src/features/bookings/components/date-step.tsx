"use client";

import { startOfToday } from "date-fns";
import { useMemo } from "react";
import { Calendar } from "@/components/ui/calendar";
import { useServiceAvailability } from "@/features/bookings/hooks/use-availability";
import { TimeSlotPicker } from "@/features/bookings/components/time-slot-picker";
import { resolveSlots, type ResolvedSlot } from "@/features/bookings/lib/slots";
import { formatLongDate, fromISODate, toISODate } from "@/lib/format";

interface DateStepProps {
  serviceId: string;
  /** "yyyy-MM-dd" */
  date: string | undefined;
  onDateChange: (date: string) => void;
  /** `key` of the selected slot. */
  slotKey: string | null;
  onSlotChange: (slot: ResolvedSlot) => void;
}

export function DateStep({
  serviceId,
  date,
  onDateChange,
  slotKey,
  onSlotChange,
}: DateStepProps) {
  const availability = useServiceAvailability(serviceId, date);
  const slots = useMemo(
    () => (date ? resolveSlots(date, availability.data) : []),
    [date, availability.data],
  );
  const selectedDate = fromISODate(date) ?? undefined;

  return (
    <div className="grid gap-6 md:grid-cols-[auto_1fr]">
      <div className="mx-auto rounded-lg border md:mx-0">
        <Calendar
          mode="single"
          selected={selectedDate}
          defaultMonth={selectedDate}
          disabled={{ before: startOfToday() }}
          onSelect={(next) => {
            if (next) onDateChange(toISODate(next));
          }}
        />
      </div>

      <div className="min-w-0 space-y-4">
        <div>
          <h3 className="text-base font-semibold">
            {selectedDate ? formatLongDate(selectedDate) : "Choose a date"}
          </h3>
          <p className="text-sm text-muted-foreground">
            {selectedDate
              ? "Pick an available time."
              : "Select a day to see the available times."}
          </p>
        </div>

        {selectedDate ? (
          <TimeSlotPicker
            slots={slots}
            value={slotKey}
            onChange={onSlotChange}
            isLoading={availability.isPending}
            error={availability.error}
            onRetry={() => void availability.refetch()}
          />
        ) : null}
      </div>
    </div>
  );
}
