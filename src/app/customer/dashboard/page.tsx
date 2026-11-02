"use client";

import {
  Bell,
  CalendarCheck,
  CalendarPlus,
  CreditCard,
  Search,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { EmptyState } from "@/components/shared/empty-state";
import { ErrorState } from "@/components/shared/error-state";
import { ListSkeleton } from "@/components/shared/loading-skeleton";
import { PageHeader } from "@/components/shared/page-header";
import { StatCard } from "@/components/shared/stat-card";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ROUTES } from "@/config/routes";
import { useProfile } from "@/features/auth/hooks/use-profile";
import { BookingList } from "@/features/bookings/components/booking-list";
import { useMyBookings } from "@/features/bookings/hooks/use-bookings";
import { useRecentNotifications } from "@/features/notifications/hooks/use-notifications";
import { UPCOMING_BOOKING_STATUSES } from "@/lib/constants";
import { formatDate, toISODate } from "@/lib/format";
import type { Booking } from "@/types";

function needsPayment(booking: Booking): boolean {
  return (
    booking.paymentStatus === "unpaid" || booking.paymentStatus === "failed"
  );
}

export default function CustomerDashboardPage() {
  const profile = useProfile();
  const [today] = useState(() => toISODate(new Date()));
  const { unreadCount } = useRecentNotifications();
  const query = useMyBookings({
    dateFrom: today,
    page: 1,
    pageSize: 10,
    sortBy: "start_time",
    sortOrder: "asc",
  });

  const upcoming = (query.data?.items ?? []).filter((booking) =>
    UPCOMING_BOOKING_STATUSES.includes(booking.status),
  );
  const awaitingPayment = upcoming.filter(needsPayment);
  const next = upcoming[0];
  const firstName = profile.data?.firstName;

  return (
    <div className="space-y-6">
      <PageHeader
        title={firstName ? `Hello, ${firstName}` : "Dashboard"}
        description="Here's what's coming up."
        actions={
          <Button asChild>
            <Link href={ROUTES.customer.newBooking}>
              <CalendarPlus aria-hidden />
              Book a service
            </Link>
          </Button>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Next appointment"
          value={next ? formatDate(next.startTime, "MMM d, h:mm a") : "None"}
          icon={CalendarCheck}
          description={next?.service?.name}
          loading={query.isPending}
        />
        <StatCard
          title="Upcoming"
          value={upcoming.length}
          icon={CalendarCheck}
          loading={query.isPending}
        />
        <StatCard
          title="Awaiting payment"
          value={awaitingPayment.length}
          icon={CreditCard}
          description={
            awaitingPayment.length > 0
              ? "Pay to secure your booking"
              : undefined
          }
          loading={query.isPending}
        />
        <StatCard
          title="Unread notifications"
          value={unreadCount}
          icon={Bell}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
        <section aria-labelledby="upcoming-heading" className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 id="upcoming-heading" className="text-lg font-semibold">
              Upcoming appointments
            </h2>
            <Button asChild variant="ghost" size="sm">
              <Link href={ROUTES.customer.bookings}>View all</Link>
            </Button>
          </div>
          {query.isPending ? (
            <ListSkeleton rows={3} />
          ) : query.isError && !query.data ? (
            <ErrorState
              error={query.error}
              onRetry={() => void query.refetch()}
            />
          ) : upcoming.length === 0 ? (
            <EmptyState
              icon={CalendarPlus}
              title="Nothing booked yet"
              description="Find a service and pick a time that works for you."
              action={
                <Button asChild size="sm">
                  <Link href={ROUTES.customer.newBooking}>Book a service</Link>
                </Button>
              }
            />
          ) : (
            <BookingList
              bookings={upcoming.slice(0, 5)}
              role="customer"
              showDate
            />
          )}
        </section>

        <Card className="self-start">
          <CardHeader>
            <CardTitle className="text-base">Quick actions</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-2">
            <Button asChild variant="outline" className="justify-start">
              <Link href={ROUTES.customer.newBooking}>
                <CalendarPlus aria-hidden />
                Book a service
              </Link>
            </Button>
            <Button asChild variant="outline" className="justify-start">
              <Link href={ROUTES.services}>
                <Search aria-hidden />
                Browse services
              </Link>
            </Button>
            <Button asChild variant="outline" className="justify-start">
              <Link href={ROUTES.customer.bookings}>
                <CalendarCheck aria-hidden />
                All my bookings
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
