"use client";

import {
  CalendarCheck,
  CircleX,
  DollarSign,
  Trophy,
  UserCheck,
  Users,
} from "lucide-react";
import { StatCard } from "@/components/shared/stat-card";
import type { ReportRange } from "@/features/reports/api/reports.api";
import {
  useBookingsReport,
  useCustomersReport,
  useRevenueReport,
  useServicesReport,
  useStaffPerformanceReport,
} from "@/features/reports/hooks/use-reports";
import { env } from "@/lib/constants";
import { formatCurrency, formatNumber, formatPercent } from "@/lib/format";

export function ReportKpis({ range }: { range: ReportRange }) {
  const bookings = useBookingsReport(range);
  const revenue = useRevenueReport(range);
  const customers = useCustomersReport(range);
  const services = useServicesReport(range);
  const staff = useStaffPerformanceReport(range);

  const topService = [...(services.data?.items ?? [])].sort(
    (a, b) => b.bookings - a.bookings,
  )[0];
  const topStaff = [...(staff.data?.items ?? [])].sort(
    (a, b) => b.revenue - a.revenue,
  )[0];
  const total = bookings.data?.totalBookings ?? 0;
  const cancelled = bookings.data?.cancelledBookings ?? 0;
  const currency = revenue.data?.currency ?? env.defaultCurrency;
  const anyError =
    bookings.isError ||
    revenue.isError ||
    customers.isError ||
    services.isError ||
    staff.isError;

  return (
    <div className="space-y-3">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <StatCard
          title="Total bookings"
          value={
            bookings.data ? formatNumber(bookings.data.totalBookings) : "—"
          }
          icon={CalendarCheck}
          description={
            bookings.data
              ? `${formatNumber(bookings.data.completedBookings)} completed`
              : undefined
          }
          loading={bookings.isPending}
        />
        <StatCard
          title="Revenue"
          value={
            revenue.data
              ? formatCurrency(revenue.data.totalRevenue, currency)
              : "—"
          }
          icon={DollarSign}
          description={
            revenue.data?.averageBookingValue
              ? `${formatCurrency(revenue.data.averageBookingValue, currency)} average`
              : undefined
          }
          loading={revenue.isPending}
        />
        <StatCard
          title="Cancellations"
          value={bookings.data ? formatNumber(cancelled) : "—"}
          icon={CircleX}
          description={
            bookings.data && total > 0
              ? `${formatPercent((cancelled / total) * 100, 1)} of bookings`
              : undefined
          }
          loading={bookings.isPending}
        />
        <StatCard
          title="Active customers"
          value={
            customers.data ? formatNumber(customers.data.activeCustomers) : "—"
          }
          icon={Users}
          description={
            customers.data
              ? `${formatNumber(customers.data.newCustomers)} new`
              : undefined
          }
          loading={customers.isPending}
        />
        <StatCard
          title="Top service"
          value={
            <span className="block truncate text-xl">
              {topService?.serviceName ?? "—"}
            </span>
          }
          icon={Trophy}
          description={
            topService
              ? `${formatNumber(topService.bookings)} bookings`
              : undefined
          }
          loading={services.isPending}
        />
        <StatCard
          title="Top staff member"
          value={
            <span className="block truncate text-xl">
              {topStaff?.staffName ?? "—"}
            </span>
          }
          icon={UserCheck}
          description={
            topStaff
              ? `${formatCurrency(topStaff.revenue, currency)} revenue`
              : undefined
          }
          loading={staff.isPending}
        />
      </div>
      {anyError ? (
        <p className="text-sm text-muted-foreground">
          Some figures couldn&apos;t be loaded.
        </p>
      ) : null}
    </div>
  );
}
