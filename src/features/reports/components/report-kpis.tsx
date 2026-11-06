"use client";

import {
  BriefcaseBusiness,
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
  const primaryTopStaff = [...(staff.data?.items ?? [])].sort(
    (a, b) => b.revenue - a.revenue,
  )[0];
  const bookingMetrics = bookings.data as
    | (NonNullable<typeof bookings.data> & {
        total_bookings?: number;
        booking_count?: number;
        completed_bookings?: number;
        cancelled_bookings?: number;
        canceled_bookings?: number;
      })
    | undefined;
  const revenueMetrics = revenue.data as
    | (NonNullable<typeof revenue.data> & { total_revenue?: number })
    | undefined;
  const customerMetrics = customers.data as
    | (NonNullable<typeof customers.data> & {
        active_customers?: number;
        new_customers?: number;
      })
    | undefined;
  const serviceMetrics = services.data as
    | (NonNullable<typeof services.data> & {
        total_services?: number;
        service_count?: number;
      })
    | undefined;
  const total =
    bookingMetrics?.total_bookings ??
    bookingMetrics?.booking_count ??
    bookingMetrics?.totalBookings ??
    0;
  const completed =
    bookingMetrics?.completed_bookings ?? bookingMetrics?.completedBookings ?? 0;
  const totalRevenue =
    revenueMetrics?.total_revenue ?? revenueMetrics?.totalRevenue ?? 0;
  const activeCustomers =
    revenue.data?.paymentsCount ||
    total ||
    customerMetrics?.active_customers ||
    customerMetrics?.activeCustomers ||
    0;
  const newCustomers =
    customerMetrics?.new_customers ?? customerMetrics?.newCustomers ?? 0;
  const totalServices =
    serviceMetrics?.total_services ??
    serviceMetrics?.service_count ??
    serviceMetrics?.totalServices ??
    serviceMetrics?.items.length ??
    0;
  const cancelled =
    bookingMetrics?.cancelled_bookings ??
    bookingMetrics?.canceled_bookings ??
    bookingMetrics?.cancelledBookings ??
    0;
  const topStaff = primaryTopStaff ??
    (bookings.data
      ? {
          staffName: "All staff (aggregate)",
          bookings: total,
          revenue: totalRevenue,
        }
      : undefined);
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
          value={bookings.data ? formatNumber(total) : "—"}
          icon={CalendarCheck}
          description={
            bookings.data
              ? `${formatNumber(completed)} completed`
              : undefined
          }
          loading={bookings.isPending}
        />
        <StatCard
          title="Revenue"
          value={
            revenue.data
              ? formatCurrency(totalRevenue, currency)
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
            customers.data ? formatNumber(activeCustomers) : "—"
          }
          icon={Users}
          description={
            customers.data
              ? `${formatNumber(newCustomers)} new`
              : undefined
          }
          loading={customers.isPending}
        />
        <StatCard
          title="Services"
          value={services.data ? formatNumber(totalServices) : "—"}
          icon={BriefcaseBusiness}
          loading={services.isPending}
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
