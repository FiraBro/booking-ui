"use client";

import {
  Area,
  AreaChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { ReportRange } from "@/features/reports/api/reports.api";
import { ChartCard } from "@/features/reports/components/chart-card";
import { useBookingsReport } from "@/features/reports/hooks/use-reports";
import {
  AXIS_TICK,
  CHART_COLORS,
  TOOLTIP_STYLE,
} from "@/features/reports/lib/chart-theme";
import { downloadCsv } from "@/features/reports/lib/csv";
import { formatDate, formatNumber } from "@/lib/format";

export function BookingsChart({ range }: { range: ReportRange }) {
  const query = useBookingsReport(range);
  const series = query.data?.series ?? [];

  return (
    <ChartCard
      title="Bookings over time"
      description="New bookings and cancellations per day."
      isLoading={query.isPending}
      error={query.error}
      onRetry={() => void query.refetch()}
      isEmpty={series.length === 0}
      onExport={() =>
        downloadCsv(
          "bookings-report.csv",
          series.map((row) => ({
            date: row.date,
            bookings: row.bookings,
            cancellations: row.cancellations,
          })),
        )
      }
    >
      <div
        role="img"
        aria-label={`Bookings chart. ${formatNumber(query.data?.totalBookings)} bookings in total.`}
      >
        <ResponsiveContainer width="100%" height={280}>
          <AreaChart
            data={series}
            margin={{ top: 8, right: 8, left: -16, bottom: 0 }}
          >
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="var(--border)"
              vertical={false}
            />
            <XAxis
              dataKey="date"
              tickFormatter={(value: string) => formatDate(value, "MMM d")}
              tick={AXIS_TICK}
              tickLine={false}
              axisLine={false}
              minTickGap={24}
            />
            <YAxis
              allowDecimals={false}
              tick={AXIS_TICK}
              tickLine={false}
              axisLine={false}
            />
            <Tooltip
              contentStyle={TOOLTIP_STYLE}
              labelFormatter={(label) => formatDate(String(label))}
            />
            <Legend />
            <Area
              type="monotone"
              dataKey="bookings"
              name="Bookings"
              stroke={CHART_COLORS.primary}
              fill={CHART_COLORS.primary}
              fillOpacity={0.15}
              strokeWidth={2}
            />
            <Area
              type="monotone"
              dataKey="cancellations"
              name="Cancellations"
              stroke={CHART_COLORS.danger}
              fill={CHART_COLORS.danger}
              fillOpacity={0.1}
              strokeWidth={2}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </ChartCard>
  );
}
