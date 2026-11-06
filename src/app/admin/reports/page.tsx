"use client";

import { Printer } from "lucide-react";
import { useState } from "react";
import {
  DateRangeFilter,
  type DateRangeValue,
} from "@/components/shared/date-range-filter";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { BookingsChart } from "@/features/reports/components/bookings-chart";
import { CustomersPanel } from "@/features/reports/components/customers-panel";
import { ReportKpis } from "@/features/reports/components/report-kpis";
import { RevenueChart } from "@/features/reports/components/revenue-chart";
import { ServicesChart } from "@/features/reports/components/services-chart";
import { StaffPerformanceChart } from "@/features/reports/components/staff-performance-chart";
import { defaultReportRange } from "@/features/reports/lib/range";
import { formatDate } from "@/lib/format";

export default function AdminReportsPage() {
  const [range, setRange] = useState<DateRangeValue>(() => defaultReportRange());

  return (
    <div className="space-y-6">
      <PageHeader
        title="Reports"
        description="Performance across bookings, revenue, services, staff and customers."
        actions={
          <div className="no-print flex flex-wrap items-center gap-2">
            <DateRangeFilter
              value={range}
              clearable={false}
              onChange={(next) =>
                setRange(
                  next.dateFrom && next.dateTo ? next : defaultReportRange(),
                )
              }
            />
            <Button variant="outline" onClick={() => window.print()}>
              <Printer aria-hidden />
              Print
            </Button>
          </div>
        }
      />

      <p className="print-only text-sm">
        Period: {formatDate(range.dateFrom)} – {formatDate(range.dateTo)}
      </p>

      <ReportKpis range={range} />

      <div className="grid gap-6 xl:grid-cols-2">
        <BookingsChart range={range} />
        <RevenueChart range={range} />
      </div>
      <div className="grid gap-6 xl:grid-cols-2">
        <ServicesChart range={range} />
        <CustomersPanel range={range} />
      </div>
      <StaffPerformanceChart range={range} />
    </div>
  );
}
