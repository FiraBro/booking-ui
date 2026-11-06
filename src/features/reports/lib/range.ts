import { addDays, subDays } from "date-fns";
import { toISODate } from "@/lib/format";

/** The last `days` days including today, e.g. lastDays(30). */
export function lastDays(days: number): { dateFrom: string; dateTo: string } {
  const today = new Date();
  return {
    dateFrom: toISODate(subDays(today, days - 1)),
    dateTo: toISODate(today),
  };
}

/** The default reports period includes historical activity and upcoming schedules. */
export function defaultReportRange(): { dateFrom: string; dateTo: string } {
  const today = new Date();
  return {
    dateFrom: toISODate(subDays(today, 90)),
    dateTo: toISODate(addDays(today, 30)),
  };
}
