"use client";

import Link from "next/link";
import { useState } from "react";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { ROUTES } from "@/config/routes";
import { useProfile } from "@/features/auth/hooks/use-profile";
import { BookingsTable } from "@/features/bookings/components/booking-table";
import { useBookings } from "@/features/bookings/hooks/use-bookings";
import { BookingsChart } from "@/features/reports/components/bookings-chart";
import { ReportKpis } from "@/features/reports/components/report-kpis";
import { RevenueChart } from "@/features/reports/components/revenue-chart";
import { lastDays } from "@/features/reports/lib/range";

export default function AdminDashboardPage() {
  const profile = useProfile();
  const [range] = useState(() => lastDays(30));
  const recent = useBookings({
    page: 1,
    pageSize: 5,
    sortBy: "created_at",
    sortOrder: "desc",
  });
  const firstName = profile.data?.firstName;

  return (
    <div className="space-y-6">
      <PageHeader
        title={firstName ? `Welcome back, ${firstName}` : "Dashboard"}
        description="The last 30 days at a glance."
        actions={
          <Button asChild variant="outline">
            <Link href={ROUTES.admin.reports}>Full reports</Link>
          </Button>
        }
      />

      <ReportKpis range={range} />

      <div className="grid gap-6 xl:grid-cols-2">
        <BookingsChart range={range} />
        <RevenueChart range={range} />
      </div>

      <section aria-labelledby="recent-heading" className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 id="recent-heading" className="text-lg font-semibold">
            Recent bookings
          </h2>
          <Button asChild variant="ghost" size="sm">
            <Link href={ROUTES.admin.bookings}>View all</Link>
          </Button>
        </div>
        <BookingsTable
          role="admin"
          data={recent.data?.items}
          isLoading={recent.isPending}
          isFetching={recent.isFetching}
          error={recent.error}
          onRetry={() => void recent.refetch()}
        />
      </section>
    </div>
  );
}
