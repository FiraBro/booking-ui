"use client";

import { useMemo, useState } from "react";
import { DatePicker } from "@/components/shared/date-picker";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ROUTES } from "@/config/routes";
import { useServiceAvailability } from "@/features/bookings/hooks/use-availability";
import { resolveSlots } from "@/features/bookings/lib/slots";
import { getErrorMessage } from "@/lib/api/error";
import { formatTime, toISODate } from "@/lib/format";
import Link from "next/link";

/** Read-only preview of open times on the public service page. Booking happens in the wizard. */
export function ServiceAvailabilityPreview({
  serviceId,
}: {
  serviceId: string;
}) {
  const [date, setDate] = useState<string | undefined>(() =>
    toISODate(new Date()),
  );
  const availability = useServiceAvailability(serviceId, date);
  const open = useMemo(
    () =>
      date
        ? resolveSlots(date, availability.data).filter(
            (slot) => slot.isAvailable,
          )
        : [],
    [date, availability.data],
  );

  return (
    <section
      aria-labelledby="availability-heading"
      className="space-y-4 rounded-lg border bg-card p-5"
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h2 id="availability-heading" className="text-lg font-semibold">
          Availability
        </h2>
        <div className="sm:w-64">
          <DatePicker value={date} onChange={setDate} minDate={new Date()} />
        </div>
      </div>

      {availability.isPending ? (
        <div aria-busy="true" className="flex flex-wrap gap-2">
          <span role="status" className="sr-only">
            Loading availability…
          </span>
          {Array.from({ length: 6 }, (_, index) => (
            <Skeleton key={index} className="h-6 w-16" />
          ))}
        </div>
      ) : availability.isError ? (
        <p className="text-sm text-muted-foreground">
          {getErrorMessage(
            availability.error,
            "Availability is unavailable right now.",
          )}{" "}
          You can still start a booking to see live times.
        </p>
      ) : open.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No open times on this day. Try another date.
        </p>
      ) : (
        <ul className="flex flex-wrap gap-2" aria-label="Open times">
          {open.slice(0, 12).map((slot) => (
            <li key={slot.key}>
              <Badge variant="outline" className="tabular">
                {formatTime(slot.start)}
              </Badge>
            </li>
          ))}
          {open.length > 12 ? (
            <li className="self-center text-xs text-muted-foreground">
              +{open.length - 12} more
            </li>
          ) : null}
        </ul>
      )}

      <Button asChild>
        <Link href={ROUTES.customer.bookNow(serviceId)}>Book a time</Link>
      </Button>
    </section>
  );
}
