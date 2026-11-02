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
import { useServicesReport } from "@/features/reports/hooks/use-reports";
import {
  AXIS_TICK,
  CHART_COLORS,
  TOOLTIP_STYLE,
} from "@/features/reports/lib/chart-theme";
import { downloadCsv } from "@/features/reports/lib/csv";
import { truncate } from "@/lib/utils";

export function ServicesChart({ range }: { range: ReportRange }) {
  const query = useServicesReport(range);
  const items = [...(query.data?.items ?? [])].sort(
    (a, b) => b.bookings - a.bookings,
  );
  const top = items
    .slice(0, 8)
    .map((item) => ({ ...item, label: truncate(item.serviceName, 22) }));

  return (
    <ChartCard
      title="Service popularity"
      description="Most booked services."
      isLoading={query.isPending}
      error={query.error}
      onRetry={() => void query.refetch()}
      isEmpty={items.length === 0}
      onExport={() =>
        downloadCsv(
          "services-report.csv",
          items.map((item) => ({
            service: item.serviceName,
            bookings: item.bookings,
            revenue: item.revenue,
          })),
        )
      }
    >
      <div
        role="img"
        aria-label={`Service popularity chart. Top service: ${items[0]?.serviceName ?? "none"}.`}
      >
        <ResponsiveContainer
          width="100%"
          height={Math.max(200, top.length * 36 + 40)}
        >
          <BarChart
            data={top}
            layout="vertical"
            margin={{ top: 4, right: 16, left: 8, bottom: 0 }}
          >
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="var(--border)"
              horizontal={false}
            />
            <XAxis
              type="number"
              allowDecimals={false}
              tick={AXIS_TICK}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              type="category"
              dataKey="label"
              width={130}
              tick={AXIS_TICK}
              tickLine={false}
              axisLine={false}
            />
            <Tooltip
              contentStyle={TOOLTIP_STYLE}
              cursor={{ fill: "var(--muted)", opacity: 0.4 }}
            />
            <Bar
              dataKey="bookings"
              name="Bookings"
              fill={CHART_COLORS.primary}
              radius={[0, 4, 4, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </ChartCard>
  );
}
