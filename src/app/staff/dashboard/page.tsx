"use client";

import { addDays } from "date-fns";
import { CalendarCheck, CalendarClock, Clock } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { EmptyState } from "@/components/shared/empty-state";
import { ErrorState } from "@/components/shared/error-state";
import { ListSkeleton } from "@/components/shared/loading-skeleton";
import { PageHeader } from "@/components/shared/page-header";
import { StatCard } from "@/components/shared/stat-card";
import { Button } from "@/components/ui/button";
import { ROUTES } from "@/config/routes";
import { useProfile } from "@/features/auth/hooks/use-profile";
import { BookingList } from "@/features/bookings/components/booking-list";
import { useStaffBookings } from "@/features/bookings/hooks/use-bookings";
import { UPCOMING_BOOKING_STATUSES } from "@/lib/constants";
import { formatDate, formatLongDate, toISODate } from "@/lib/format";

export default function StaffDashboardPage() {
  const profile = useProfile();
  const [range] = useState(() => {
    const now = new Date();
    return { today: toISODate(now), until: toISODate(addDays(now, 7)) };
  });

  const query = useStaffBookings({
    dateFrom: range.today,
    dateTo: range.until,
    page: 1,
    pageSize: 50,
    sortBy: "start_time",
    sortOrder: "asc",
  });

  const items = (query.data?.items ?? []).filter((booking) =>
    UPCOMING_BOOKING_STATUSES.includes(booking.status),
  );
  const todayItems = items.filter(
    (booking) => formatDate(booking.startTime, "yyyy-MM-dd") === range.today,
  );
  const pending = items.filter((booking) => booking.status === "pending");
  const next = items[0];
  const firstName = profile.data?.firstName;

  return (
    <div className="space-y-6">
      <PageHeader
        title={firstName ? `Hello, ${firstName}` : "Dashboard"}
        description={formatLongDate(new Date())}
        actions={
          <Button asChild variant="outline">
            <Link href={ROUTES.staff.schedule}>
              <CalendarClock aria-hidden />
              Open schedule
            </Link>
          </Button>
        }
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard
          title="Today"
          value={todayItems.length}
          icon={CalendarCheck}
          description="appointments"
          loading={query.isPending}
        />
        <StatCard
          title="Awaiting confirmation"
          value={pending.length}
          icon={Clock}
          description="next 7 days"
          loading={query.isPending}
        />
        <StatCard
          title="Next appointment"
          value={next ? formatDate(next.startTime, "MMM d, h:mm a") : "None"}
          icon={CalendarClock}
          loading={query.isPending}
        />
      </div>

      <section aria-labelledby="today-heading" className="space-y-3">
        <h2 id="today-heading" className="text-lg font-semibold">
          Today&apos;s appointments
        </h2>
        {query.isPending ? (
          <ListSkeleton rows={3} />
        ) : query.isError && !query.data ? (
          <ErrorState
            error={query.error}
            onRetry={() => void query.refetch()}
          />
        ) : todayItems.length === 0 ? (
          <EmptyState
            icon={CalendarCheck}
            title="Nothing scheduled today"
            description="Enjoy the quiet. New bookings will appear here."
          />
        ) : (
          <BookingList bookings={todayItems} role="staff" />
        )}
      </section>

      {items.length > todayItems.length ? (
        <section aria-labelledby="upcoming-heading" className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 id="upcoming-heading" className="text-lg font-semibold">
              Coming up
            </h2>
            <Button asChild variant="ghost" size="sm">
              <Link href={ROUTES.staff.bookings}>All bookings</Link>
            </Button>
          </div>
          <BookingList
            bookings={items
              .filter((booking) => !todayItems.includes(booking))
              .slice(0, 5)}
            role="staff"
            showDate
          />
        </section>
      ) : null}
    </div>
  );
}
