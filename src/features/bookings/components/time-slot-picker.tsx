"use client";

import { CalendarClock } from "lucide-react";
import { EmptyState } from "@/components/shared/empty-state";
import { ErrorState } from "@/components/shared/error-state";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DAY_PART_LABELS,
  groupByDayPart,
  type DayPart,
  type ResolvedSlot,
} from "@/features/bookings/lib/slots";
import { formatTime } from "@/lib/format";
import { cn } from "@/lib/utils";

interface TimeSlotPickerProps {
  slots: ResolvedSlot[];
  /** `key` of the selected slot, or null. */
  value: string | null;
  onChange: (slot: ResolvedSlot) => void;
  isLoading?: boolean;
  error?: unknown;
  onRetry?: () => void;
  className?: string;
}

const PARTS: DayPart[] = ["morning", "afternoon", "evening"];

export function TimeSlotPicker({
  slots,
  value,
  onChange,
  isLoading,
  error,
  onRetry,
  className,
}: TimeSlotPickerProps) {
  if (isLoading) {
    return (
      <div aria-busy="true" className={className}>
        <span role="status" className="sr-only">
          Loading available times…
        </span>
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
          {Array.from({ length: 8 }, (_, index) => (
            <Skeleton key={index} className="h-8 w-full" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <ErrorState
        error={error}
        onRetry={onRetry}
        className={cn("p-6", className)}
      />
    );
  }

  const hasAvailable = slots.some((slot) => slot.isAvailable);
  if (!hasAvailable) {
    return (
      <EmptyState
        icon={CalendarClock}
        title="No available times"
        description="This day is fully booked or unavailable. Try another date."
        className={cn("p-6 sm:p-6", className)}
      />
    );
  }

  const groups = groupByDayPart(slots);

  return (
    <div className={cn("space-y-5", className)}>
      {PARTS.map((part) =>
        groups[part].length === 0 ? null : (
          <section
            key={part}
            aria-labelledby={`slots-${part}`}
            className="space-y-2"
          >
            <h4
              id={`slots-${part}`}
              className="text-xs font-medium uppercase tracking-wider text-muted-foreground"
            >
              {DAY_PART_LABELS[part]}
            </h4>
            <div
              role="group"
              aria-labelledby={`slots-${part}`}
              className="grid grid-cols-3 gap-2 sm:grid-cols-4"
            >
              {groups[part].map((slot) => {
                const selected = slot.key === value;
                return (
                  <Button
                    key={slot.key}
                    type="button"
                    size="sm"
                    variant={selected ? "default" : "outline"}
                    disabled={!slot.isAvailable}
                    aria-pressed={selected}
                    title={
                      !slot.isAvailable
                        ? (slot.reason ?? "Unavailable")
                        : undefined
                    }
                    className={cn(
                      "tabular",
                      !slot.isAvailable && "line-through opacity-50",
                    )}
                    onClick={() => onChange(slot)}
                  >
                    {formatTime(slot.start)}
                    {!slot.isAvailable ? (
                      <span className="sr-only"> (unavailable)</span>
                    ) : null}
                  </Button>
                );
              })}
            </div>
          </section>
        ),
      )}
    </div>
  );
}
