"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { ReportRange } from "@/features/reports/api/reports.api";
import { ChartCard } from "@/features/reports/components/chart-card";
import { useStaffPerformanceReport } from "@/features/reports/hooks/use-reports";
import {
  AXIS_TICK,
  CHART_COLORS,
  TOOLTIP_STYLE,
} from "@/features/reports/lib/chart-theme";
import { downloadCsv } from "@/features/reports/lib/csv";
import { env } from "@/lib/constants";
import { formatCurrency, formatNumber, formatPercent } from "@/lib/format";
import { truncate } from "@/lib/utils";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export function StaffPerformanceChart({ range }: { range: ReportRange }) {
  const query = useStaffPerformanceReport(range);
  const items = [...(query.data?.items ?? [])].sort(
    (a, b) => b.bookings - a.bookings,
  );
  const chartData = items.slice(0, 8).map((item) => ({
    label: truncate(item.staffName, 14),
    bookings: item.bookings,
    completed: item.completedBookings ?? 0,
  }));

  return (
    <ChartCard
      title="Staff performance"
      description="Bookings handled and completed per staff member."
      isLoading={query.isPending}
      error={query.error}
      onRetry={() => void query.refetch()}
      isEmpty={items.length === 0}
      onExport={() =>
        downloadCsv(
          "staff-performance-report.csv",
          items.map((item) => ({
            staff: item.staffName,
            bookings: item.bookings,
            completed: item.completedBookings,
            revenue: item.revenue,
            rating: item.rating,
            utilization: item.utilization,
          })),
        )
      }
    >
      <div className="space-y-6">
        <div role="img" aria-label="Staff performance chart">
          <ResponsiveContainer width="100%" height={260}>
            <BarChart
              data={chartData}
              margin={{ top: 8, right: 8, left: -16, bottom: 0 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="var(--border)"
                vertical={false}
              />
              <XAxis
                dataKey="label"
                tick={AXIS_TICK}
                tickLine={false}
                axisLine={false}
                interval={0}
              />
              <YAxis
                allowDecimals={false}
                tick={AXIS_TICK}
                tickLine={false}
                axisLine={false}
              />
              <Tooltip
                contentStyle={TOOLTIP_STYLE}
                cursor={{ fill: "var(--muted)", opacity: 0.4 }}
              />
              <Legend />
              <Bar
                dataKey="bookings"
                name="Bookings"
                fill={CHART_COLORS.primary}
                radius={[4, 4, 0, 0]}
              />
              <Bar
                dataKey="completed"
                name="Completed"
                fill={CHART_COLORS.tertiary}
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <Table>
          <TableCaption className="sr-only">
            Staff performance details
          </TableCaption>
          <TableHeader>
            <TableRow>
              <TableHead>Staff member</TableHead>
              <TableHead className="text-right">Bookings</TableHead>
              <TableHead className="text-right">Revenue</TableHead>
              <TableHead className="hidden text-right sm:table-cell">
                Utilization
              </TableHead>
              <TableHead className="hidden text-right sm:table-cell">
                Rating
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((item) => (
              <TableRow key={item.staffId ?? item.staffName}>
                <TableCell className="font-medium">{item.staffName}</TableCell>
                <TableCell className="tabular text-right">
                  {formatNumber(item.bookings)}
                </TableCell>
                <TableCell className="tabular text-right">
                  {formatCurrency(item.revenue, env.defaultCurrency)}
                </TableCell>
                <TableCell className="tabular hidden text-right sm:table-cell">
                  {formatPercent(item.utilization)}
                </TableCell>
                <TableCell className="tabular hidden text-right sm:table-cell">
                  {item.rating ? item.rating.toFixed(1) : "—"}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </ChartCard>
  );
}
