"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { ReportRange } from "@/features/reports/api/reports.api";
import { ChartCard } from "@/features/reports/components/chart-card";
import { useRevenueReport } from "@/features/reports/hooks/use-reports";
import {
  AXIS_TICK,
  CHART_COLORS,
  TOOLTIP_STYLE,
} from "@/features/reports/lib/chart-theme";
import { downloadCsv } from "@/features/reports/lib/csv";
import { env } from "@/lib/constants";
import { formatCompactNumber, formatCurrency, formatDate } from "@/lib/format";

export function RevenueChart({ range }: { range: ReportRange }) {
  const query = useRevenueReport(range);
  const series = query.data?.series ?? [];
  const currency = query.data?.currency ?? env.defaultCurrency;

  return (
    <ChartCard
      title="Revenue trend"
      description="Revenue per day."
      isLoading={query.isPending}
      error={query.error}
      onRetry={() => void query.refetch()}
      isEmpty={series.length === 0}
      onExport={() =>
        downloadCsv(
          "revenue-report.csv",
          series.map((row) => ({
            date: row.date,
            revenue: row.revenue,
            bookings: row.bookings,
          })),
        )
      }
    >
      <div
        role="img"
        aria-label={`Revenue chart. ${formatCurrency(query.data?.totalRevenue, currency)} in total.`}
      >
        <ResponsiveContainer width="100%" height={280}>
          <BarChart
            data={series}
            margin={{ top: 8, right: 8, left: -8, bottom: 0 }}
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
              tickFormatter={(value: number) => formatCompactNumber(value)}
              tick={AXIS_TICK}
              tickLine={false}
              axisLine={false}
            />
            <Tooltip
              contentStyle={TOOLTIP_STYLE}
              cursor={{ fill: "var(--muted)", opacity: 0.4 }}
              labelFormatter={(label) => formatDate(String(label))}
              formatter={(value) => formatCurrency(Number(value), currency)}
            />
            <Bar
              dataKey="revenue"
              name="Revenue"
              fill={CHART_COLORS.secondary}
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </ChartCard>
  );
}
