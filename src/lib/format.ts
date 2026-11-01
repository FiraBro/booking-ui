import {
  differenceInMinutes,
  format,
  formatDistanceToNow,
  isValid,
  parse,
  parseISO,
} from "date-fns";
import { env } from "@/lib/constants";
import type { User } from "@/types";

/* -------------------------------------------------------------------------- */
/* Dates and times (rendered in the viewer's local timezone)                  */
/* -------------------------------------------------------------------------- */

export function toDate(
  value: Date | string | number | null | undefined,
): Date | null {
  if (value === null || value === undefined || value === "") return null;
  const date =
    value instanceof Date
      ? value
      : typeof value === "number"
        ? new Date(value)
        : parseISO(value);
  return isValid(date) ? date : null;
}

export function formatDate(
  value: Date | string | number | null | undefined,
  pattern = "MMM d, yyyy",
  fallback = "—",
): string {
  const date = toDate(value);
  return date ? format(date, pattern) : fallback;
}

export function formatLongDate(
  value: Date | string | number | null | undefined,
  fallback = "—",
): string {
  return formatDate(value, "EEEE, MMMM d, yyyy", fallback);
}

export function formatTime(
  value: Date | string | number | null | undefined,
  pattern = "h:mm a",
  fallback = "—",
): string {
  const date = toDate(value);
  return date ? format(date, pattern) : fallback;
}

export function formatDateTime(
  value: Date | string | number | null | undefined,
  fallback = "—",
): string {
  return formatDate(value, "MMM d, yyyy 'at' h:mm a", fallback);
}

export function formatTimeRange(
  start: Date | string | null | undefined,
  end: Date | string | null | undefined,
): string {
  const startDate = toDate(start);
  if (!startDate) return "—";
  const endDate = toDate(end);
  return endDate
    ? `${format(startDate, "h:mm a")} – ${format(endDate, "h:mm a")}`
    : format(startDate, "h:mm a");
}

export function formatRelativeTime(
  value: Date | string | number | null | undefined,
  fallback = "—",
): string {
  const date = toDate(value);
  return date ? formatDistanceToNow(date, { addSuffix: true }) : fallback;
}

/** "14:30" -> "2:30 PM". Returns the input unchanged when it is not an HH:mm string. */
export function formatTimeOfDay(
  value: string | null | undefined,
  fallback = "—",
): string {
  if (!value) return fallback;
  const parsed = parse(value.slice(0, 5), "HH:mm", new Date());
  return isValid(parsed) ? format(parsed, "h:mm a") : value;
}

/** Date -> "yyyy-MM-dd" in local time (the format used by availability queries and filters). */
export function toISODate(value: Date): string {
  return format(value, "yyyy-MM-dd");
}

/** "yyyy-MM-dd" -> local Date at midnight. */
export function fromISODate(value: string | null | undefined): Date | null {
  if (!value) return null;
  const parsed = parse(value, "yyyy-MM-dd", new Date());
  return isValid(parsed) ? parsed : null;
}

/** Combines a calendar date and an "HH:mm" string into a local Date. */
export function combineDateAndTime(date: Date, time: string): Date {
  const [hours = "0", minutes = "0"] = time.split(":");
  const result = new Date(date);
  result.setHours(Number(hours), Number(minutes), 0, 0);
  return result;
}

export function minutesBetween(
  start: Date | string | null | undefined,
  end: Date | string | null | undefined,
): number | null {
  const startDate = toDate(start);
  const endDate = toDate(end);
  return startDate && endDate ? differenceInMinutes(endDate, startDate) : null;
}

/** 90 -> "1h 30m", 45 -> "45 min", 120 -> "2h". */
export function formatDuration(
  minutes: number | null | undefined,
  fallback = "—",
): string {
  if (minutes === null || minutes === undefined || !Number.isFinite(minutes))
    return fallback;
  const total = Math.max(0, Math.round(minutes));
  const hours = Math.floor(total / 60);
  const remainder = total % 60;
  if (hours === 0) return `${remainder} min`;
  if (remainder === 0) return `${hours}h`;
  return `${hours}h ${remainder}m`;
}

/* -------------------------------------------------------------------------- */
/* Numbers and money                                                          */
/* -------------------------------------------------------------------------- */

const currencyFormatters = new Map<string, Intl.NumberFormat>();

/** Amounts are treated as major units (e.g. 49.99), not cents. */
export function formatCurrency(
  amount: number | null | undefined,
  currency: string | null | undefined = env.defaultCurrency,
  fallback = "—",
): string {
  if (amount === null || amount === undefined || !Number.isFinite(amount))
    return fallback;
  const code = (currency || env.defaultCurrency).toUpperCase();
  const key = `${env.defaultLocale}:${code}`;
  let formatter = currencyFormatters.get(key);
  if (!formatter) {
    try {
      formatter = new Intl.NumberFormat(env.defaultLocale, {
        style: "currency",
        currency: code,
      });
    } catch {
      formatter = new Intl.NumberFormat(env.defaultLocale, {
        style: "currency",
        currency: "USD",
      });
    }
    currencyFormatters.set(key, formatter);
  }
  return formatter.format(amount);
}

export function formatNumber(
  value: number | null | undefined,
  fallback = "—",
): string {
  if (value === null || value === undefined || !Number.isFinite(value))
    return fallback;
  return new Intl.NumberFormat(env.defaultLocale).format(value);
}

export function formatCompactNumber(
  value: number | null | undefined,
  fallback = "—",
): string {
  if (value === null || value === undefined || !Number.isFinite(value))
    return fallback;
  return new Intl.NumberFormat(env.defaultLocale, {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(value);
}

/** Expects a value on a 0–100 scale. */
export function formatPercent(
  value: number | null | undefined,
  digits = 0,
  fallback = "—",
): string {
  if (value === null || value === undefined || !Number.isFinite(value))
    return fallback;
  return `${value.toFixed(digits)}%`;
}

/* -------------------------------------------------------------------------- */
/* Text                                                                       */
/* -------------------------------------------------------------------------- */

/** "in_progress" -> "In progress". */
export function humanize(
  value: string | null | undefined,
  fallback = "—",
): string {
  if (!value) return fallback;
  const text = value.replace(/[_-]+/g, " ").trim().toLowerCase();
  return text.charAt(0).toUpperCase() + text.slice(1);
}

type NameSource = Partial<
  Pick<User, "firstName" | "lastName" | "name" | "email">
> & { fullName?: string | null };

export function getDisplayName(
  source: NameSource | null | undefined,
  fallback = "Unknown",
): string {
  if (!source) return fallback;
  const composed = [source.firstName, source.lastName]
    .filter(Boolean)
    .join(" ")
    .trim();
  return composed || source.fullName || source.name || source.email || fallback;
}
