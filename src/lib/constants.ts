export const APP_NAME = process.env.NEXT_PUBLIC_APP_NAME ?? "Bookly";

export const env = {
  apiBaseUrl: (
    process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8080/api/v1"
  ).replace(/\/+$/, ""),
  appUrl: (process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000").replace(
    /\/+$/,
    "",
  ),
  defaultCurrency: process.env.NEXT_PUBLIC_DEFAULT_CURRENCY ?? "USD",
  defaultLocale: process.env.NEXT_PUBLIC_DEFAULT_LOCALE ?? "en-US",
  isProduction: process.env.NODE_ENV === "production",
} as const;

/** Server-side API base URL (route handlers). Never call from client components. */
export function getServerApiBaseUrl(): string {
  const base = process.env.API_INTERNAL_BASE_URL || env.apiBaseUrl;
  return base.replace(/\/+$/, "");
}

/* -------------------------------------------------------------------------- */
/* Roles                                                                      */
/* -------------------------------------------------------------------------- */

export const USER_ROLES = ["customer", "staff", "admin"] as const;
export type UserRole = (typeof USER_ROLES)[number];

export const USER_ROLE_LABELS: Record<UserRole, string> = {
  customer: "Customer",
  staff: "Staff",
  admin: "Administrator",
};

export function parseUserRole(
  value: string | null | undefined,
): UserRole | null {
  if (!value) return null;
  const normalized = value.toLowerCase();
  return (USER_ROLES as readonly string[]).includes(normalized)
    ? (normalized as UserRole)
    : null;
}

/* -------------------------------------------------------------------------- */
/* Bookings                                                                   */
/* -------------------------------------------------------------------------- */

export const BOOKING_STATUSES = [
  "pending",
  "confirmed",
  "in_progress",
  "completed",
  "cancelled",
  "no_show",
  "refunded",
] as const;
export type BookingStatus = (typeof BOOKING_STATUSES)[number];

export const BOOKING_STATUS_LABELS: Record<BookingStatus, string> = {
  pending: "Pending",
  confirmed: "Confirmed",
  in_progress: "In progress",
  completed: "Completed",
  cancelled: "Cancelled",
  no_show: "No show",
  refunded: "Refunded",
};

/** Statuses an admin/staff member may move a booking to, keyed by current status. */
export const BOOKING_STATUS_TRANSITIONS: Record<
  BookingStatus,
  readonly BookingStatus[]
> = {
  pending: ["confirmed", "cancelled"],
  confirmed: ["in_progress", "completed", "cancelled", "no_show"],
  in_progress: ["completed", "cancelled"],
  completed: [],
  cancelled: [],
  no_show: [],
  refunded: [],
};

/** Statuses in which a customer may still cancel or request a change. */
export const CUSTOMER_MODIFIABLE_STATUSES: readonly BookingStatus[] = [
  "pending",
  "confirmed",
];

export const UPCOMING_BOOKING_STATUSES: readonly BookingStatus[] = [
  "pending",
  "confirmed",
  "in_progress",
];

/* -------------------------------------------------------------------------- */
/* Payments                                                                   */
/* -------------------------------------------------------------------------- */

export const PAYMENT_STATUSES = [
  "unpaid",
  "pending",
  "paid",
  "failed",
  "refunded",
  "partially_refunded",
] as const;
export type PaymentStatus = (typeof PAYMENT_STATUSES)[number];

export const PAYMENT_STATUS_LABELS: Record<PaymentStatus, string> = {
  unpaid: "Unpaid",
  pending: "Payment pending",
  paid: "Paid",
  failed: "Payment failed",
  refunded: "Refunded",
  partially_refunded: "Partially refunded",
};

export const PAYMENT_POLL_INTERVAL_MS = 4_000;
export const PAYMENT_POLL_MAX_DURATION_MS = 120_000;

/* -------------------------------------------------------------------------- */
/* Misc domain constants                                                      */
/* -------------------------------------------------------------------------- */

export const NOTIFICATION_TYPES = [
  "info",
  "success",
  "warning",
  "error",
] as const;
export type NotificationType = (typeof NOTIFICATION_TYPES)[number];
export const NOTIFICATION_POLL_INTERVAL_MS = 60_000;

/** 0 = Sunday ... 6 = Saturday (matches JavaScript's Date#getDay). */
export const DAYS_OF_WEEK = [
  { value: 0, label: "Sunday", short: "Sun" },
  { value: 1, label: "Monday", short: "Mon" },
  { value: 2, label: "Tuesday", short: "Tue" },
  { value: 3, label: "Wednesday", short: "Wed" },
  { value: 4, label: "Thursday", short: "Thu" },
  { value: 5, label: "Friday", short: "Fri" },
  { value: 6, label: "Saturday", short: "Sat" },
] as const;

export const DEFAULT_PAGE_SIZE = 10;
export const PAGE_SIZE_OPTIONS = [10, 20, 50, 100] as const;
export const SEARCH_DEBOUNCE_MS = 350;

export const STALE_TIME = {
  short: 15_000,
  default: 60_000,
  long: 5 * 60_000,
  static: 30 * 60_000,
} as const;

/* -------------------------------------------------------------------------- */
/* Session cookies (set by the Next.js route handlers, read by middleware)    */
/* -------------------------------------------------------------------------- */

export const COOKIE_NAMES = {
  /** httpOnly. Holds the refresh token; never readable from JavaScript. */
  refreshToken: "bk_refresh_token",
  /** Readable. Advisory role + "has session" hint used by middleware and the client. */
  role: "bk_role",
} as const;

/* -------------------------------------------------------------------------- */
/* TanStack Query keys                                                        */
/* -------------------------------------------------------------------------- */

type Filters = Record<string, unknown> | undefined;

export const queryKeys = {
  auth: {
    profile: ["auth", "profile"] as const,
  },
  users: {
    all: ["users"] as const,
    list: (filters?: Filters) => ["users", filters ?? {}] as const,
    detail: (id: string) => ["user", id] as const,
  },
  services: {
    all: ["services"] as const,
    list: (filters?: Filters) => ["services", filters ?? {}] as const,
    detail: (id: string) => ["service", id] as const,
    categories: ["service-categories"] as const,
  },
  staff: {
    all: ["staff"] as const,
    list: (filters?: Filters) => ["staff", filters ?? {}] as const,
    detail: (id: string) => ["staff-member", id] as const,
    services: (id: string) => ["staff-services", id] as const,
    schedule: (id: string) => ["staff-schedule", id] as const,
  },
  availability: {
    all: ["availability"] as const,
    service: (serviceId: string, date: string, staffId?: string | null) =>
      ["availability", serviceId, date, staffId ?? "any"] as const,
    staff: (staffId: string, date: string, serviceId?: string | null) =>
      ["availability", "staff", staffId, date, serviceId ?? "any"] as const,
  },
  bookings: {
    all: ["bookings"] as const,
    list: (filters?: Filters) => ["bookings", filters ?? {}] as const,
    mine: (filters?: Filters) => ["bookings", "my", filters ?? {}] as const,
    detail: (id: string) => ["booking", id] as const,
  },
  payments: {
    status: (bookingId: string) => ["payment-status", bookingId] as const,
  },
  notifications: {
    all: ["notifications"] as const,
    list: (filters?: Filters) => ["notifications", filters ?? {}] as const,
  },
  reports: {
    all: ["reports"] as const,
    bookings: (range?: Filters) =>
      ["reports", "bookings", range ?? {}] as const,
    revenue: (range?: Filters) => ["reports", "revenue", range ?? {}] as const,
    services: (range?: Filters) =>
      ["reports", "services", range ?? {}] as const,
    staffPerformance: (range?: Filters) =>
      ["reports", "staff-performance", range ?? {}] as const,
    customers: (range?: Filters) =>
      ["reports", "customers", range ?? {}] as const,
  },
  settings: ["settings"] as const,
  logs: {
    all: ["logs"] as const,
    list: (filters?: Filters) => ["logs", filters ?? {}] as const,
  },
} as const;
