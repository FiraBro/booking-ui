import type { z } from "zod";
import { api, type ResponseSchema } from "@/lib/api/client";
import { endpoints } from "@/lib/api/endpoints";
import { removeEmptyValues } from "@/lib/utils";
import {
  bookingsReportSchema,
  customersReportSchema,
  revenueReportSchema,
  servicesReportSchema,
  staffPerformanceReportSchema,
} from "@/lib/validations/auth";
import type {
  BookingsReport,
  CustomersReport,
  RevenueReport,
  ServicesReport,
  StaffPerformanceReport,
} from "@/types";

export interface ReportRange {
  /** "yyyy-MM-dd" */
  dateFrom?: string;
  dateTo?: string;
}

function fetchReport<T>(
  url: string,
  range: ReportRange,
  schema: ResponseSchema<T>,
): Promise<T> {
  return api.get<T>(url, {
    params: removeEmptyValues({
      dateFrom: range.dateFrom,
      dateTo: range.dateTo,
    }),
    schema,
  });
}

export const reportsApi = {
  bookings: (range: ReportRange): Promise<BookingsReport> =>
    fetchReport<BookingsReport>(
      endpoints.reports.bookings,
      range,
      bookingsReportSchema,
    ),
  revenue: (range: ReportRange): Promise<RevenueReport> =>
    fetchReport<RevenueReport>(
      endpoints.reports.revenue,
      range,
      revenueReportSchema,
    ),
  services: (range: ReportRange): Promise<ServicesReport> =>
    fetchReport<ServicesReport>(
      endpoints.reports.services,
      range,
      servicesReportSchema,
    ),
  staffPerformance: (range: ReportRange): Promise<StaffPerformanceReport> =>
    fetchReport<StaffPerformanceReport>(
      endpoints.reports.staffPerformance,
      range,
      staffPerformanceReportSchema,
    ),
  customers: (range: ReportRange): Promise<CustomersReport> =>
    fetchReport<CustomersReport>(
      endpoints.reports.customers,
      range,
      customersReportSchema,
    ),
};

export type { z };
