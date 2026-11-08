"use client";

import {
  addDays,
  endOfDay,
  isSameDay,
  startOfDay,
  startOfWeek,
} from "date-fns";
import { ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { ErrorState } from "@/components/shared/error-state";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useStaffBookings } from "@/features/bookings/hooks/use-bookings";
import { getBookingHref, personName } from "@/features/bookings/lib/display";
import { useStaffSchedule } from "@/features/staff/hooks/use-staff";
import type { BookingStatus, UserRole } from "@/lib/constants";
import {
  formatDate,
  formatLongDate,
  formatTime,
  toDate,
  toISODate,
} from "@/lib/format";
import { cn } from "@/lib/utils";
import type { Booking, Holiday, WorkingHour } from "@/types";

const HOUR_PX = 48;
const DAY_MINUTES = 24 * 60;

type View = "week" | "day";

const BLOCK_STYLES: Record<BookingStatus, string> = {
  pending: "border-warning/60 bg-warning/20",
  confirmed: "border-info/60 bg-info/20",
  in_progress: "border-info/60 bg-info/30",
  completed: "border-success/60 bg-success/20",
  cancelled: "border-border bg-muted text-muted-foreground line-through",
  no_show: "border-border bg-muted text-muted-foreground line-through",
  refunded: "border-border bg-muted text-muted-foreground",
};

const STRIPES = {
  backgroundImage:
    "repeating-linear-gradient(135deg, transparent 0 6px, color-mix(in oklab, var(--muted-foreground) 18%, transparent) 6px 7px)",
} as const;

function minutesOfTime(time: string): number {
  const [hours = "0", minutes = "0"] = time.split(":");
  return Number(hours) * 60 + Number(minutes);
}

function minutesOfDate(date: Date): number {
  return date.getHours() * 60 + date.getMinutes();
}

function isOnHoliday(date: Date, holidays: Holiday[]): boolean {
  const key = toISODate(date);
  return holidays.some(
    (holiday) =>
      key >= holiday.startDate.slice(0, 10) &&
      key <= holiday.endDate.slice(0, 10),
  );
}

interface Block {
  booking: Booking;
  start: number;
  end: number;
}

function toBlocks(bookings: Booking[], day: Date): Block[] {
  const blocks: Block[] = [];
  for (const booking of bookings) {
    const start = toDate(booking.startTime);
    if (!start || !isSameDay(start, day)) continue;
    const end = toDate(booking.endTime);
    const startMinutes = minutesOfDate(start);
    const endMinutes =
      end && isSameDay(start, end)
        ? minutesOfDate(end)
        : Math.min(startMinutes + 60, DAY_MINUTES);
    blocks.push({
      booking,
      start: startMinutes,
      end: Math.max(endMinutes, startMinutes + 15),
    });
  }
  return blocks;
}

interface DayColumnProps {
  date: Date;
  fromMinutes: number;
  toMinutes: number;
  working: WorkingHour[];
  blocked: boolean;
  bookings: Booking[];
  role: UserRole;
}

function DayColumn({
  date,
  fromMinutes,
  toMinutes,
  working,
  blocked,
  bookings,
  role,
}: DayColumnProps) {
  const height = ((toMinutes - fromMinutes) / 60) * HOUR_PX;
  const hours = (toMinutes - fromMinutes) / 60;
  const offset = (minutes: number) => ((minutes - fromMinutes) / 60) * HOUR_PX;
  const dayOff = working.length === 0;

  return (
    <div
      className="relative border-l"
      style={{ height }}
      aria-label={formatLongDate(date)}
    >
      {Array.from({ length: hours }, (_, index) => (
        <div
          key={index}
          className="absolute inset-x-0 border-t border-border/60"
          style={{ top: index * HOUR_PX }}
        />
      ))}

      {working.map((row) => (
        <div
          key={`${row.startTime}-${row.endTime}`}
          className="absolute inset-x-0 bg-success/10"
          style={{
            top: Math.max(offset(minutesOfTime(row.startTime)), 0),
            height: Math.max(
              ((minutesOfTime(row.endTime) -
                Math.max(minutesOfTime(row.startTime), fromMinutes)) /
                60) *
                HOUR_PX,
              0,
            ),
          }}
        />
      ))}

      {blocked || dayOff ? (
        <div
          className={cn(
            "absolute inset-0",
            blocked ? "bg-destructive/10" : "bg-muted/60",
          )}
          style={STRIPES}
          title={blocked ? "Time off" : "Not working"}
        />
      ) : null}

      {toBlocks(bookings, date).map(({ booking, start, end }) => {
        const href = getBookingHref(role, booking.id);
        const top = Math.max(offset(start), 0);
        const blockHeight = Math.max(
          ((end - Math.max(start, fromMinutes)) / 60) * HOUR_PX,
          22,
        );
        const label = `${formatTime(booking.startTime)} ${booking.service?.name ?? "Booking"} · ${personName(booking.customer, "Customer")}`;
        const className = cn(
          "absolute inset-x-1 overflow-hidden rounded-md border px-1.5 py-0.5 text-left text-xs leading-tight",
          BLOCK_STYLES[booking.status],
          href &&
            "hover:ring-2 hover:ring-ring focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        );
        const content = (
          <>
            <span className="tabular block font-medium">
              {formatTime(booking.startTime)}
            </span>
            <span className="block truncate">
              {booking.service?.name ?? "Booking"}
            </span>
            {blockHeight > 56 ? (
              <span className="block truncate opacity-80">
                {personName(booking.customer, "Customer")}
              </span>
            ) : null}
          </>
        );
        return href ? (
          <Link
            key={booking.id}
            href={href}
            className={className}
            style={{ top, height: blockHeight }}
            title={label}
          >
            {content}
          </Link>
        ) : (
          <div
            key={booking.id}
            className={className}
            style={{ top, height: blockHeight }}
            title={label}
          >
            {content}
          </div>
        );
      })}
    </div>
  );
}

interface ScheduleCalendarProps {
  staffId: string | undefined;
  role: UserRole;
}

export function ScheduleCalendar({ staffId, role }: ScheduleCalendarProps) {
  const [view, setView] = useState<View>("week");
  const [anchor, setAnchor] = useState<Date>(() => startOfDay(new Date()));

  const weekStart = startOfWeek(anchor, { weekStartsOn: 1 });
  const days =
    view === "day"
      ? [anchor]
      : Array.from({ length: 7 }, (_, index) => addDays(weekStart, index));
  const first = days[0] as Date;
  const last = days[days.length - 1] as Date;

  const schedule = useStaffSchedule(staffId);
  const bookingsQuery = useStaffBookings(
    {
      staffId,
      dateFrom: toISODate(first),
      dateTo: toISODate(endOfDay(last)),
      page: 1,
      pageSize: 100,
      sortBy: "start_time",
      sortOrder: "asc",
    },
    { enabled: Boolean(staffId) },
  );

  const bookings = bookingsQuery.data?.items ?? [];
  const workingRows = (schedule.data?.workingHours ?? []).filter(
    (row) => row.isWorking,
  );
  const holidays = schedule.data?.holidays ?? [];

  let min = 8 * 60;
  let max = 18 * 60;
  if (workingRows.length > 0) {
    min = Math.min(...workingRows.map((row) => minutesOfTime(row.startTime)));
    max = Math.max(...workingRows.map((row) => minutesOfTime(row.endTime)));
  }
  for (const booking of bookings) {
    const start = toDate(booking.startTime);
    if (!start) continue;
    const end = toDate(booking.endTime);
    min = Math.min(min, minutesOfDate(start));
    max = Math.max(
      max,
      end && isSameDay(start, end)
        ? minutesOfDate(end)
        : Math.min(minutesOfDate(start) + 60, DAY_MINUTES),
    );
  }
  const startHour = Math.max(0, Math.floor(min / 60));
  const endHour = Math.min(24, Math.max(Math.ceil(max / 60), startHour + 1));
  const fromMinutes = startHour * 60;
  const toMinutes = endHour * 60;

  const step = view === "week" ? 7 : 1;
  const title =
    view === "day"
      ? formatLongDate(anchor)
      : `${formatDate(first, "MMM d")} – ${formatDate(last, "MMM d, yyyy")}`;
  const failed = schedule.isError || bookingsQuery.isError;
  const loading =
    Boolean(staffId) && (schedule.isPending || bookingsQuery.isPending);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            className="size-8"
            aria-label="Previous"
            onClick={() => setAnchor(addDays(anchor, -step))}
          >
            <ChevronLeft aria-hidden />
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="size-8"
            aria-label="Next"
            onClick={() => setAnchor(addDays(anchor, step))}
          >
            <ChevronRight aria-hidden />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setAnchor(startOfDay(new Date()))}
          >
            Today
          </Button>
          <h3 className="ml-2 text-sm font-semibold" aria-live="polite">
            {title}
          </h3>
        </div>

        <div role="group" aria-label="Calendar view" className="flex gap-1">
          <Button
            size="sm"
            variant={view === "week" ? "default" : "outline"}
            aria-pressed={view === "week"}
            onClick={() => setView("week")}
          >
            Week
          </Button>
          <Button
            size="sm"
            variant={view === "day" ? "default" : "outline"}
            aria-pressed={view === "day"}
            onClick={() => setView("day")}
          >
            Day
          </Button>
        </div>
      </div>

      <ul
        className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground"
        aria-label="Legend"
      >
        <li className="flex items-center gap-1.5">
          <span
            className="size-3 rounded-sm border bg-success/20"
            aria-hidden
          />
          Available
        </li>
        <li className="flex items-center gap-1.5">
          <span
            className="size-3 rounded-sm border border-info/60 bg-info/20"
            aria-hidden
          />
          Booked
        </li>
        <li className="flex items-center gap-1.5">
          <span
            className="size-3 rounded-sm border bg-muted"
            style={STRIPES}
            aria-hidden
          />
          Not working / time off
        </li>
      </ul>

      {failed ? (
        <ErrorState
          error={schedule.error ?? bookingsQuery.error}
          onRetry={() => {
            void schedule.refetch();
            void bookingsQuery.refetch();
          }}
        />
      ) : loading ? (
        <Skeleton className="h-96 w-full" />
      ) : (
        <div
          className="overflow-x-auto rounded-lg border bg-card"
          aria-busy={bookingsQuery.isFetching ? true : undefined}
        >
          <div style={{ minWidth: view === "week" ? 760 : 320 }}>
            <div className="flex border-b">
              <div className="w-14 shrink-0" />
              {days.map((day) => (
                <div
                  key={day.toISOString()}
                  className={cn(
                    "flex-1 border-l px-2 py-2 text-center text-xs font-medium",
                    isSameDay(day, new Date()) && "bg-primary/5 text-primary",
                  )}
                >
                  {formatDate(day, "EEE d")}
                </div>
              ))}
            </div>

            <div className="flex">
              <div
                className="relative w-14 shrink-0"
                style={{ height: ((toMinutes - fromMinutes) / 60) * HOUR_PX }}
              >
                {Array.from({ length: endHour - startHour }, (_, index) => (
                  <span
                    key={index}
                    className="tabular absolute right-2 -translate-y-1/2 text-[11px] text-muted-foreground"
                    style={{ top: index * HOUR_PX + (index === 0 ? 8 : 0) }}
                  >
                    {formatDate(new Date(2000, 0, 1, startHour + index), "h a")}
                  </span>
                ))}
              </div>
              {days.map((day) => (
                <div key={day.toISOString()} className="min-w-0 flex-1">
                  <DayColumn
                    date={day}
                    fromMinutes={fromMinutes}
                    toMinutes={toMinutes}
                    working={workingRows.filter(
                      (row) => row.dayOfWeek === day.getDay(),
                    )}
                    blocked={isOnHoliday(day, holidays)}
                    bookings={bookings}
                    role={role}
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {bookingsQuery.data && bookingsQuery.data.meta.total > bookings.length ? (
        <p className="text-xs text-muted-foreground">
          Showing the first {bookings.length} of {bookingsQuery.data.meta.total}{" "}
          bookings in this period.
        </p>
      ) : null}
    </div>
  );
}
