import { subDays } from "date-fns";
import { toISODate } from "@/lib/format";

/** The last `days` days including today, e.g. lastDays(30). */
export function lastDays(days: number): { dateFrom: string; dateTo: string } {
  const today = new Date();
  return {
    dateFrom: toISODate(subDays(today, days - 1)),
    dateTo: toISODate(today),
  };
}
