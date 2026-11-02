"use client";

import type { ReportRange } from "@/features/reports/api/reports.api";
import { ChartCard } from "@/features/reports/components/chart-card";
import { useCustomersReport } from "@/features/reports/hooks/use-reports";
import { downloadCsv } from "@/features/reports/lib/csv";
import { env } from "@/lib/constants";
import { formatCurrency, formatNumber } from "@/lib/format";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export function CustomersPanel({ range }: { range: ReportRange }) {
  const query = useCustomersReport(range);
  const data = query.data;

  const summary: Array<[string, number | null | undefined]> = [
    ["Total customers", data?.totalCustomers],
    ["Active", data?.activeCustomers],
    ["New", data?.newCustomers],
    ["Returning", data?.returningCustomers],
  ];

  return (
    <ChartCard
      title="Customers"
      description="Customer activity and top spenders."
      isLoading={query.isPending}
      error={query.error}
      onRetry={() => void query.refetch()}
      isEmpty={
        !data || (data.totalCustomers === 0 && data.topCustomers.length === 0)
      }
      onExport={() =>
        downloadCsv(
          "customers-report.csv",
          (data?.topCustomers ?? []).map((customer) => ({
            customer: customer.name,
            email: customer.email,
            bookings: customer.bookings,
            total_spent: customer.totalSpent,
          })),
        )
      }
    >
      <div className="space-y-6">
        <dl className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {summary.map(([label, value]) => (
            <div key={label} className="rounded-lg border p-3">
              <dt className="text-xs text-muted-foreground">{label}</dt>
              <dd className="tabular mt-1 text-xl font-semibold">
                {formatNumber(value)}
              </dd>
            </div>
          ))}
        </dl>

        {data && data.topCustomers.length > 0 ? (
          <Table>
            <TableCaption className="sr-only">Top customers</TableCaption>
            <TableHeader>
              <TableRow>
                <TableHead>Customer</TableHead>
                <TableHead className="text-right">Bookings</TableHead>
                <TableHead className="text-right">Total spent</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.topCustomers.map((customer) => (
                <TableRow key={customer.customerId ?? customer.name}>
                  <TableCell>
                    <p className="font-medium">{customer.name}</p>
                    {customer.email ? (
                      <p className="text-xs text-muted-foreground">
                        {customer.email}
                      </p>
                    ) : null}
                  </TableCell>
                  <TableCell className="tabular text-right">
                    {formatNumber(customer.bookings)}
                  </TableCell>
                  <TableCell className="tabular text-right">
                    {formatCurrency(customer.totalSpent, env.defaultCurrency)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : null}
      </div>
    </ChartCard>
  );
}
