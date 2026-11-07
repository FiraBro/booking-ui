import { z } from "zod";
import {
  BOOKING_STATUSES,
  DEFAULT_PAGE_SIZE,
  NOTIFICATION_TYPES,
  PAYMENT_STATUSES,
  USER_ROLES,
} from "@/lib/constants";
import { isRecord, toCamelCase } from "@/lib/utils";

/* ==========================================================================
   1. Common helpers
   ========================================================================== */

/** IDs may arrive as numbers or strings; the app always works with strings. */
export const idSchema = z
  .union([z.string().min(1), z.number()])
  .transform((value) => String(value));

export const TIME_REGEX = /^([01]\d|2[0-3]):[0-5]\d$/;
export const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

/** Lowercases and snake_cases enum-like strings before validating them. */
export function normalizeEnumInput(value: unknown): unknown {
  return typeof value === "string"
    ? value
        .trim()
        .toLowerCase()
        .replace(/[\s-]+/g, "_")
    : value;
}

const LIST_KEYS = [
  "items",
  "data",
  "results",
  "rows",
  "slots",
  "availability",
] as const;

/** Accepts either a bare array or an object wrapping one (items/data/results/...). */
export function unwrapList(value: unknown): unknown {
  if (Array.isArray(value)) return value;
  if (value === null || value === undefined) return [];
  if (typeof value === "object") {
    const record = value as Record<string, unknown>;
    for (const key of LIST_KEYS) {
      const candidate = record[key];
      if (Array.isArray(candidate)) return candidate;
    }
  }
  return value;
}

export function listOf<T extends z.ZodTypeAny>(item: T) {
  return z.preprocess(unwrapList, z.array(item));
}

/** Accepts true/false as well as "true"/"false"/1/0. */
export const looseBoolean = z.preprocess((value) => {
  if (value === "true" || value === 1 || value === "1") return true;
  if (value === "false" || value === 0 || value === "0") return false;
  return value;
}, z.boolean());

export const isoDateSchema = z
  .string()
  .regex(DATE_REGEX, "Use the format YYYY-MM-DD");
export const timeOfDaySchema = z
  .string()
  .regex(TIME_REGEX, "Use the 24-hour format HH:mm");

export const optionalPhoneSchema = z
  .string()
  .trim()
  .regex(/^[+()\d\s.-]{7,20}$/, "Enter a valid phone number")
  .or(z.literal(""))
  .optional();

export const messageResponseSchema = z
  .object({
    message: z.string().nullish(),
  })
  .passthrough();

/* ==========================================================================
   2. Shared field rules
   ========================================================================== */

export const emailSchema = z
  .string()
  .trim()
  .min(1, "Email is required")
  .email("Enter a valid email address")
  .max(254, "Email is too long");

export const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .max(72, "Password must be at most 72 characters")
  .regex(/[a-z]/, "Include at least one lowercase letter")
  .regex(/[A-Z]/, "Include at least one uppercase letter")
  .regex(/\d/, "Include at least one number");

const nameSchema = (label: string) =>
  z
    .string()
    .trim()
    .min(1, `${label} is required`)
    .max(50, `${label} is too long`);

/* ==========================================================================
   3. Entity (API response) schemas
   ========================================================================== */

export const userRoleSchema = z.preprocess(
  normalizeEnumInput,
  z.enum(USER_ROLES),
);
export const bookingStatusSchema = z.preprocess(
  normalizeEnumInput,
  z.enum(BOOKING_STATUSES),
);
export const paymentStatusSchema = z.preprocess(
  normalizeEnumInput,
  z.enum(PAYMENT_STATUSES),
);

const timeStringSchema = z
  .string()
  .transform((value) =>
    /^\d{2}:\d{2}(:\d{2})?$/.test(value) ? value.slice(0, 5) : value,
  );

/* ---- Users ---- */

/** Maps backend variants (user_id, username, full_name) onto id, firstName and lastName. */
function normalizeUser(value: unknown): unknown {
  if (!isRecord(value)) return value;
  const next: Record<string, unknown> = { ...value };

  if (next.id === undefined || next.id === null) {
    next.id = next.userId ?? next.ID ?? next.uuid;
  }

  const hasName =
    typeof next.firstName === "string" && next.firstName.length > 0;
  if (!hasName) {
    const full =
      typeof next.fullName === "string" && next.fullName
        ? next.fullName
        : typeof next.name === "string" && next.name
          ? next.name
          : typeof next.username === "string"
            ? next.username
            : "";
    const [first = "", ...rest] = full.trim().split(/\s+/);
    next.firstName = first;
    if (typeof next.lastName !== "string" || next.lastName.length === 0)
      next.lastName = rest.join(" ");
  }
  return next;
}

export const userSummarySchema = z.preprocess(
  normalizeUser,
  z.object({
    id: idSchema,
    firstName: z.string().default(""),
    lastName: z.string().default(""),
    name: z.string().nullish(),
    email: z.string().nullish(),
    phone: z.string().nullish(),
    avatarUrl: z.string().nullish(),
  }),
);

export const userSchema = z.preprocess(
  normalizeUser,
  z.object({
    id: idSchema,
    firstName: z.string().default(""),
    lastName: z.string().default(""),
    name: z.string().nullish(),
    email: z.string(),
    phone: z.string().nullish(),
    avatarUrl: z.string().nullish(),
    role: userRoleSchema.default("customer"),
    isActive: z.boolean().default(true),
    emailVerified: z.boolean().nullish(),
    createdAt: z.string().nullish(),
    updatedAt: z.string().nullish(),
  }),
);

/* ---- Services ---- */
export const serviceCategorySchema = z.preprocess(
  (value) => (typeof value === "string" ? { id: value, name: value } : value),
  z.object({
    id: idSchema,
    name: z.string(),
    slug: z.string().nullish(),
    description: z.string().nullish(),
    servicesCount: z.coerce.number().nullish(),
  }),
);

export const serviceSummarySchema = z.object({
  id: idSchema,
  name: z.string(),
  durationMinutes: z.coerce.number().nullish(),
  price: z.coerce.number().nullish(),
  currency: z.string().nullish(),
  imageUrl: z.string().nullish(),
});

export const serviceSchema = z.object({
  id: idSchema,
  name: z.string(),
  description: z.string().nullish(),
  durationMinutes: z.coerce.number(),
  bufferMinutes: z.coerce.number().nullish(),
  price: z.coerce.number(),
  currency: z.string().nullish(),
  categoryId: idSchema.nullish(),
  category: serviceCategorySchema.nullish(),
  imageUrl: z.string().nullish(),
  images: z.array(z.string()).default([]),
  isActive: z.boolean().default(true),
  staffCount: z.coerce.number().nullish(),
  createdAt: z.string().nullish(),
  updatedAt: z.string().nullish(),
});

/* ---- Staff and schedules ---- */

export const staffSummarySchema = z.object({
  id: idSchema,
  firstName: z.string().nullish().catch(undefined),
  lastName: z.string().nullish().catch(undefined),
  name: z.string().nullish().catch(undefined),
  title: z.string().nullish().catch(undefined),
  avatarUrl: z.string().nullish().catch(undefined),
});

export const staffSchema = staffSummarySchema.extend({
  userId: idSchema.nullish(),
  email: z.string().nullish().catch(undefined),
  phone: z.string().nullish().catch(undefined),
  bio: z.string().nullish().catch(undefined),
  isActive: z.boolean().catch(true),
  serviceIds: z.array(idSchema).catch([]),
  services: z.array(z.any()).optional(),
  createdAt: z.string().nullish().catch(undefined),
  updatedAt: z.string().nullish().catch(undefined),
}).passthrough();

export const workingHourSchema = z.object({
  id: idSchema.nullish(),
  staffId: idSchema.nullish(),
  /** 0 = Sunday ... 6 = Saturday */
  dayOfWeek: z.coerce.number().int().min(0).max(6),
  startTime: timeStringSchema,
  endTime: timeStringSchema,
  isWorking: z.boolean().default(true),
});

export const holidaySchema = z.object({
  id: idSchema.nullish(),
  staffId: idSchema.nullish(),
  startDate: z.string(),
  endDate: z.string(),
  reason: z.string().nullish(),
});

export const scheduleSchema = z.object({
  staffId: idSchema.nullish(),
  workingHours: listOf(workingHourSchema),
  holidays: listOf(holidaySchema),
});

/** Accepts arbitrary schedule payloads and keeps only rows the UI can render. */
export const scheduleResponseSchema = z.unknown().transform((value) => {
  const schedule = isRecord(value)
    ? isRecord(value.schedule)
      ? value.schedule
      : value
    : {};
  const workingHours =
    (Array.isArray(value) ? value : undefined) ??
    (Array.isArray(schedule.workingHours)
      ? schedule.workingHours
      : Array.isArray(schedule.days)
        ? schedule.days
        : Array.isArray(schedule.availability)
          ? schedule.availability
          : []);
  const holidays = Array.isArray(schedule.holidays) ? schedule.holidays : [];
  const staffId = idSchema.safeParse(schedule.staffId);

  return {
    ...(staffId.success ? { staffId: staffId.data } : {}),
    workingHours: workingHours.flatMap((row) => {
      const parsed = workingHourSchema.safeParse(row);
      return parsed.success ? [parsed.data] : [];
    }),
    holidays: holidays.flatMap((holiday) => {
      const parsed = holidaySchema.safeParse(holiday);
      return parsed.success ? [parsed.data] : [];
    }),
  };
});

export const staffServicesResponseSchema = z.preprocess((value) => {
  const list = Array.isArray(value)
    ? value
    : isRecord(value) && Array.isArray(value.serviceIds)
      ? value.serviceIds
      : isRecord(value) && Array.isArray(value.services)
        ? value.services
        : [];
  return list.map((entry) => (isRecord(entry) ? entry.id : entry));
}, z.array(idSchema));

/* ---- Availability ---- */

/** `startTime`/`endTime` may be ISO datetimes or "HH:mm" strings, depending on the backend. */
export const availabilitySlotSchema = z.preprocess(
  (value) => (typeof value === "string" ? { startTime: value } : value),
  z
    .object({
      startTime: z.string(),
      endTime: z.string().nullish(),
      isAvailable: z.boolean().optional(),
      available: z.boolean().optional(),
      staffId: idSchema.nullish(),
      staffName: z.string().nullish(),
      reason: z.string().nullish(),
    })
    .transform(({ available, isAvailable, ...rest }) => ({
      ...rest,
      isAvailable: isAvailable ?? available ?? true,
    })),
);

const availabilitySlotsSchema = z.array(availabilitySlotSchema);

/** Availability endpoints may return a bare list or wrap it in an object. */
function unwrapAvailabilitySlots(value: unknown): unknown {
  if (Array.isArray(value) || !isRecord(value)) return value;

  for (const key of [
    "slots",
    "availableSlots",
    "availability",
    "items",
    "results",
    "data",
  ]) {
    const nested = value[key];
    if (Array.isArray(nested)) return nested;
    if (isRecord(nested)) {
      const slots = unwrapAvailabilitySlots(nested);
      if (Array.isArray(slots)) return slots;
    }
  }

  return value;
}

export const availabilityResponseSchema = z.preprocess(
  unwrapAvailabilitySlots,
  availabilitySlotsSchema,
);

/** GET /availability/services/{id} returns string times in an object envelope. */
export const serviceAvailabilityResponseSchema = z
  .object({
    availableSlots: z.array(z.string()),
    date: z.string(),
    serviceId: z.string(),
  })
  .transform(({ availableSlots }) =>
    availableSlots.map((startTime) => ({ startTime, isAvailable: true })),
  );

/* ---- Bookings ---- */

export const bookingSchema = z.preprocess(
  (value) => {
    if (!isRecord(value)) return value;
    const customer =
      value.customer ??
      value.user ??
      value.customerProfile ??
      value.customer_profile;
    const staffValue =
      value.staff ?? value.assignedStaff ?? value.assigned_staff;
    let staff = staffValue;
    if (isRecord(staffValue)) {
      const staffUser = isRecord(staffValue.user) ? staffValue.user : {};
      const mergedStaff = { ...staffUser, ...staffValue };
      staff = {
        ...mergedStaff,
        id: staffValue.id ?? staffUser.id,
        name:
          mergedStaff.name ??
          mergedStaff.displayName ??
          mergedStaff.fullName,
      };
    }
    const paymentValue = value.payment;
    const payments = value.payments;
    const rootStatus =
      typeof value.status === "string" ? value.status.toLowerCase() : undefined;
    const paymentStatus =
      value.paymentStatus ??
      (isRecord(paymentValue) ? paymentValue.status : undefined) ??
      (Array.isArray(payments)
        ? payments.find(
            (item) => isRecord(item) && typeof item.status === "string",
          )?.status
        : undefined) ??
      (rootStatus &&
      (PAYMENT_STATUSES as readonly string[]).includes(rootStatus)
        ? rootStatus
        : undefined);
    return {
      ...value,
      customer,
      staff,
      paymentStatus,
      startTime:
        value.startTime ??
        value.scheduledAt ??
        value.scheduledTime ??
        value.start_time ??
        value.scheduled_at,
    };
  },
  z.object({
    id: idSchema,
    reference: z.string().nullish().catch(undefined),
    customerId: idSchema.nullish().catch(undefined),
    customer: z
      .preprocess(
        normalizeUser,
        z
          .object({
            id: idSchema.optional(),
            firstName: z.string().default(""),
            lastName: z.string().default(""),
            name: z.string().nullish(),
            email: z.string().nullish(),
            phone: z.string().nullish(),
            avatarUrl: z.string().nullish(),
          })
          .passthrough(),
      )
      .nullish()
      .catch(undefined),
    serviceId: idSchema.nullish().catch(undefined),
    service: serviceSummarySchema.nullish().catch(undefined),
    staffId: idSchema.nullish().catch(undefined),
    staff: z
      .object({
        id: idSchema.optional(),
        firstName: z.string().nullish(),
        lastName: z.string().nullish(),
        email: z.string().nullish(),
        name: z.string().nullish(),
      })
      .passthrough()
      .nullish()
      .catch(undefined),
    startTime: z.string().catch(""),
    endTime: z.string().nullish().catch(undefined),
    status: bookingStatusSchema.catch("pending"),
    paymentStatus: paymentStatusSchema.nullish().catch(undefined),
    totalPrice: z.coerce.number().nullish().catch(undefined),
    currency: z.string().nullish().catch(undefined),
    notes: z.string().nullish().catch(undefined),
    cancellationReason: z.string().nullish().catch(undefined),
    createdAt: z.string().nullish().catch(undefined),
    updatedAt: z.string().nullish().catch(undefined),
  }).passthrough(),
);

/* ---- Payments ---- */

export const paymentSchema = z.object({
  id: idSchema,
  bookingId: idSchema,
  amount: z.coerce.number(),
  currency: z.string().nullish(),
  status: paymentStatusSchema,
  provider: z.string().nullish(),
  providerReference: z.string().nullish(),
  paidAt: z.string().nullish(),
  refundedAt: z.string().nullish(),
  refundedAmount: z.coerce.number().nullish(),
  failureReason: z.string().nullish(),
  createdAt: z.string().nullish(),
});

/** Response of POST /payments/checkout. Contains only a redirect URL, never provider secrets. */
export const checkoutSessionSchema = z
  .object({
    checkoutUrl: z.string().nullish(),
    redirectUrl: z.string().nullish(),
    url: z.string().nullish(),
    sessionId: z.string().nullish(),
    paymentId: idSchema.nullish(),
  })
  .transform(({ checkoutUrl, redirectUrl, url, ...rest }) => ({
    ...rest,
    checkoutUrl: checkoutUrl ?? redirectUrl ?? url ?? null,
  }));

/** Response of GET /payments/{bookingId}/status. */
export const paymentStatusInfoSchema = z.object({
  bookingId: idSchema.nullish(),
  status: paymentStatusSchema,
  amount: z.coerce.number().nullish(),
  currency: z.string().nullish(),
  paidAt: z.string().nullish(),
  refundedAmount: z.coerce.number().nullish(),
  failureReason: z.string().nullish(),
  updatedAt: z.string().nullish(),
});

/* ---- Notifications ---- */

export const notificationSchema = z
  .object({
    id: idSchema,
    title: z.string().default(""),
    message: z.string().default(""),
    type: z.string().default("info"),
    isRead: z.boolean().optional(),
    read: z.boolean().optional(),
    link: z.string().nullish(),
    data: z.record(z.string(), z.unknown()).nullish(),
    createdAt: z.string().nullish(),
  })
  .transform(({ isRead, read, ...rest }) => ({
    ...rest,
    isRead: isRead ?? read ?? false,
  }));

/* ---- Reports ---- */

function normalizeReportAliases(
  value: unknown,
  aliases: Record<string, string[]>,
): unknown {
  if (!isRecord(value)) return value;
  const output = { ...value };
  for (const [canonical, alternatives] of Object.entries(aliases)) {
    if (output[canonical] !== undefined && output[canonical] !== null) continue;
    const alias = alternatives.find(
      (key) => output[key] !== undefined && output[key] !== null,
    );
    if (alias) output[canonical] = output[alias];
  }
  return output;
}

function reportPayload(value: unknown): unknown {
  if (!isRecord(value) || !isRecord(value.data)) return value;
  return { ...value.data };
}

export const bookingsReportSchema = z.preprocess(
  (value) => {
    const payload = reportPayload(value);
    if (!isRecord(payload)) return payload;
    const series = payload.series ?? payload.daily;
    const withSeries = { ...payload, series };
    const normalized = normalizeReportAliases(withSeries, {
      totalBookings: ["total", "total_bookings", "bookingCount", "booking_count"],
      completedBookings: ["completed_bookings", "completedCount", "completed_count"],
      cancelledBookings: ["cancelled_bookings", "canceledBookings", "canceled_bookings"],
      pendingBookings: ["pending_bookings", "pendingCount", "pending_count"],
    });
    if (!isRecord(normalized)) return normalized;
    const byStatus = normalized.byStatus;
    if (byStatus && typeof byStatus === "object" && !Array.isArray(byStatus)) {
      const status = byStatus as Record<string, unknown>;
      if (normalized.cancelledBookings == null) {
        normalized.cancelledBookings = status.cancelled ?? status.canceled;
      }
    }
    return normalized;
  },
  z.object({
    totalBookings: z.coerce.number().default(0),
    completedBookings: z.coerce.number().default(0),
    cancelledBookings: z.coerce.number().default(0),
    pendingBookings: z.coerce.number().default(0),
    series: listOf(
      z.preprocess(
        (value) =>
          normalizeReportAliases(value, {
            date: ["period", "day"],
            bookings: ["count", "booking_count", "bookingCount"],
            cancellations: ["cancellation_count", "cancellationCount"],
          }),
        z.object({
          date: z.string(),
          bookings: z.coerce.number().default(0),
          cancellations: z.coerce.number().nullish(),
        }).passthrough(),
      ),
    ),
  }).passthrough(),
);

export const revenueReportSchema = z.preprocess(
  (value) => {
    const payload = reportPayload(value);
    if (!isRecord(payload)) return payload;
    const normalized = normalizeReportAliases(
      { ...payload, series: payload.series ?? payload.daily },
      {
        totalRevenue: ["total_revenue", "revenueTotal", "revenue_total"],
        paymentsCount: ["payments_count"],
        refundedAmount: ["refunded_amount", "totalRefunded", "total_refunded"],
        averageBookingValue: ["average_booking_value", "averageOrderValue"],
      },
    );
    if (!isRecord(normalized)) return normalized;
    const netRevenue = Number(normalized.netRevenue);
    const grossRevenue = Number(normalized.grossRevenue);
    if (normalized.totalRevenue == null) {
      normalized.totalRevenue =
        (Number.isFinite(netRevenue) && netRevenue !== 0
          ? netRevenue
          : undefined) ??
        (Number.isFinite(grossRevenue) ? grossRevenue : 0);
    }
    return normalized;
  },
  z.object({
    totalRevenue: z.coerce.number().default(0),
    paymentsCount: z.coerce.number().nullish(),
    refundedAmount: z.coerce.number().default(0),
    averageBookingValue: z.coerce.number().nullish(),
    currency: z.string().nullish(),
    series: listOf(
      z.preprocess(
        (value) =>
          isRecord(value)
            ? normalizeReportAliases(
                {
                  ...value,
                  date:
                    value.date ??
                    value.day ??
                    value.period ??
                    value.label ??
                    value.createdAt,
                },
                {
                  date: ["period"],
                  revenue: ["net", "gross", "amount", "total_revenue"],
                },
              )
            : value,
        z.object({
          date: z.string().optional(),
          revenue: z.coerce.number().default(0),
          bookings: z.coerce.number().nullish(),
        }).passthrough(),
      ),
    ),
  }).passthrough(),
);

export const servicesReportSchema = z.preprocess(
  (value) => {
    value = reportPayload(value);
    const record = Array.isArray(value)
      ? { items: value }
      : isRecord(value)
        ? { ...value }
        : value;
    if (!isRecord(record)) return record;
    const items = record.items ?? record.services ?? record.results ?? record.data;
    const normalized = normalizeReportAliases(
      {
        ...record,
        items,
        totalServices:
          record.totalServices ??
          record.total_services ??
          record.serviceCount ??
          record.service_count ??
          record.servicesCount ??
          record.services_count ??
          (Array.isArray(items) ? items.length : undefined),
      },
      { totalServices: ["total_services", "serviceCount", "service_count", "servicesCount", "services_count"] },
    );
    return normalized;
  },
  z.object({
    totalServices: z.coerce.number().default(0),
    items: listOf(
      z.preprocess(
        (value) =>
          normalizeReportAliases(value, {
            serviceId: ["service_id", "id"],
            serviceName: ["service_name", "name"],
            bookings: ["booking_count", "bookingCount", "total_bookings"],
            revenue: ["total_revenue", "revenue_total"],
          }),
        z.object({
          serviceId: idSchema.nullish(),
          serviceName: z.string(),
          bookings: z.coerce.number().default(0),
          revenue: z.coerce.number().default(0),
        }).passthrough(),
      ),
    ),
  }).passthrough(),
);

export const staffPerformanceReportSchema = z.preprocess(
  (value) => (Array.isArray(value) ? { items: value } : value),
  z.object({
    items: listOf(
      z.preprocess(
        (value) =>
          normalizeReportAliases(value, {
            staffId: ["staff_id", "id"],
            staffName: ["staff_name", "name"],
            bookings: ["booking_count", "bookingCount", "total_bookings"],
            completedBookings: ["completed_bookings", "completed_count"],
            revenue: ["total_revenue", "revenue_total"],
          }),
        z.object({
          staffId: idSchema.nullish(),
          staffName: z.string(),
          bookings: z.coerce.number().default(0),
          completedBookings: z.coerce.number().nullish(),
          revenue: z.coerce.number().default(0),
          rating: z.coerce.number().nullish(),
          utilization: z.coerce.number().nullish(),
        }).passthrough(),
      ),
    ),
  }).passthrough(),
);

export const customersReportSchema = z.preprocess(
  (value) =>
    normalizeReportAliases(value, {
      totalCustomers: ["total_customers", "customerCount", "customer_count"],
      activeCustomers: ["active_customers", "active_count"],
      newCustomers: ["new_customers", "new_count"],
      returningCustomers: ["returning_customers", "returning_count"],
    }),
  z.object({
    totalCustomers: z.coerce.number().default(0),
    activeCustomers: z.coerce.number().default(0),
    newCustomers: z.coerce.number().default(0),
    returningCustomers: z.coerce.number().nullish(),
    topCustomers: listOf(
      z.preprocess(
        (value) =>
          normalizeReportAliases(value, {
            customerId: ["customer_id", "id"],
            bookings: ["booking_count", "bookingCount"],
            totalSpent: ["total_spent", "total_revenue", "amount_spent"],
          }),
        z.object({
          customerId: idSchema.nullish(),
          name: z.string(),
          email: z.string().nullish(),
          bookings: z.coerce.number().default(0),
          totalSpent: z.coerce.number().default(0),
        }).passthrough(),
      ),
    ),
  }).passthrough(),
);

/* ---- Settings ---- */

const settingBaseSchema = z.object({
  businessName: z.string().default(""),
  businessEmail: z.string().nullish(),
  businessPhone: z.string().nullish(),
  businessAddress: z.string().nullish(),
  timezone: z.string().default("UTC"),
  currency: z.string().default("USD"),
  slotIntervalMinutes: z.coerce.number().default(30),
  bookingLeadTimeHours: z.coerce.number().default(1),
  cancellationWindowHours: z.coerce.number().default(24),
  maxAdvanceBookingDays: z.coerce.number().default(90),
  autoConfirmBookings: looseBoolean.default(false),
  allowCustomerCancellation: looseBoolean.default(true),
  emailNotificationsEnabled: looseBoolean.default(true),
  maintenanceMode: looseBoolean.default(false),
});

/** Accepts a flat settings object or a list of { key, value } rows. */
export const settingSchema = z.preprocess((value) => {
  if (Array.isArray(value)) {
    const output: Record<string, unknown> = {};
    for (const row of value) {
      if (isRecord(row) && typeof row.key === "string") {
        output[toCamelCase(row.key)] = row.value;
      }
    }
    return output;
  }
  return value;
}, settingBaseSchema);

/* ---- Logs ---- */

export const logSchema = z.object({
  id: idSchema,
  action: z.string().default(""),
  entity: z.string().nullish(),
  entityId: z.string().nullish(),
  level: z.string().nullish(),
  message: z.string().nullish(),
  userId: idSchema.nullish(),
  userName: z.string().nullish(),
  userEmail: z.string().nullish(),
  ipAddress: z.string().nullish(),
  metadata: z.record(z.string(), z.unknown()).nullish(),
  createdAt: z.string(),
});

/* ==========================================================================
   4. Authentication forms and responses
   ========================================================================== */

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "Password is required"),
});
export type LoginInput = z.infer<typeof loginSchema>;

export const registerSchema = z
  .object({
    firstName: nameSchema("First name"),
    lastName: nameSchema("Last name"),
    email: emailSchema,
    phone: optionalPhoneSchema,
    password: passwordSchema,
    confirmPassword: z.string().min(1, "Please confirm your password"),
    acceptTerms: z.boolean().refine((value) => value === true, {
      message: "You must accept the terms to continue",
    }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });
export type RegisterInput = z.infer<typeof registerSchema>;

export const forgotPasswordSchema = z.object({
  email: emailSchema,
});
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;

export const resetPasswordSchema = z
  .object({
    token: z.string().min(1, "Reset token is missing or invalid"),
    password: passwordSchema,
    confirmPassword: z.string().min(1, "Please confirm your password"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Current password is required"),
    newPassword: passwordSchema,
    confirmPassword: z.string().min(1, "Please confirm your new password"),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  })
  .refine((data) => data.newPassword !== data.currentPassword, {
    message: "New password must be different from the current password",
    path: ["newPassword"],
  });
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;

export const updateProfileSchema = z.object({
  firstName: nameSchema("First name"),
  lastName: nameSchema("Last name"),
  phone: optionalPhoneSchema,
});
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;

/**
 * Login / register / refresh response. Tokens may be returned at the top level
 * (access_token, refresh_token) or nested under a `tokens` object.
 */
export const authResponseSchema = z.preprocess(
  (value) => {
    if (!isRecord(value)) return value;
    const tokens = isRecord(value.tokens) ? value.tokens : {};
    return { ...tokens, ...value };
  },
  z.object({
    accessToken: z.string().min(1),
    refreshToken: z.string().nullish(),
    expiresIn: z.coerce.number().nullish(),
    tokenType: z.string().nullish(),
    user: userSchema.nullish(),
  }),
);

/** GET/PATCH /auth/profile may return the user directly or wrapped as { user }. */
export const profileResponseSchema = z.preprocess(
  (value) => (isRecord(value) && isRecord(value.user) ? value.user : value),
  userSchema,
);

/* ==========================================================================
   5. Domain form schemas
   ========================================================================== */

/* ---- Services ---- */

export const serviceFormSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Name must be at least 2 characters")
    .max(120, "Name is too long"),
  description: z
    .string()
    .trim()
    .max(2000, "Description is too long")
    .optional(),
  durationMinutes: z.coerce
    .number({ invalid_type_error: "Enter a duration in minutes" })
    .int("Duration must be a whole number")
    .min(5, "Minimum duration is 5 minutes")
    .max(1440, "Maximum duration is 24 hours"),
  bufferMinutes: z.coerce
    .number()
    .int()
    .min(0, "Buffer cannot be negative")
    .max(240)
    .optional(),
  price: z.coerce
    .number({ invalid_type_error: "Enter a price" })
    .min(0, "Price cannot be negative")
    .max(1_000_000, "Price is too high"),
  categoryId: z.string().optional(),
  imageUrl: z
    .string()
    .trim()
    .url("Enter a valid URL")
    .or(z.literal(""))
    .optional(),
  isActive: z.boolean(),
});
export type ServiceFormValues = z.infer<typeof serviceFormSchema>;

/* ---- Staff ---- */

export const staffFormSchema = z.object({
  userId: z.string().optional(),
  firstName: z.string().trim().min(1, "First name is required").max(50),
  lastName: z.string().trim().min(1, "Last name is required").max(50),
  email: emailSchema,
  phone: optionalPhoneSchema,
  title: z.string().trim().max(100).optional(),
  bio: z.string().trim().max(1000).optional(),
  isActive: z.boolean(),
});
export type StaffFormValues = z.infer<typeof staffFormSchema>;

export const staffServicesFormSchema = z.object({
  serviceIds: z.array(z.string()),
});
export type StaffServicesFormValues = z.infer<typeof staffServicesFormSchema>;

export const workingHourFormSchema = z
  .object({
    dayOfWeek: z.number().int().min(0).max(6),
    isWorking: z.boolean(),
    startTime: timeOfDaySchema,
    endTime: timeOfDaySchema,
  })
  .refine((data) => !data.isWorking || data.endTime > data.startTime, {
    message: "End time must be after start time",
    path: ["endTime"],
  });
export type WorkingHourFormValues = z.infer<typeof workingHourFormSchema>;

export const scheduleFormSchema = z.object({
  workingHours: z
    .array(workingHourFormSchema)
    .min(1, "Add at least one working day")
    .refine(
      (rows) => new Set(rows.map((row) => row.dayOfWeek)).size === rows.length,
      {
        message: "Each weekday can only appear once",
      },
    ),
});
export type ScheduleFormValues = z.infer<typeof scheduleFormSchema>;

export const holidayFormSchema = z
  .object({
    startDate: isoDateSchema,
    endDate: isoDateSchema,
    reason: z.string().trim().max(200, "Reason is too long").optional(),
  })
  .refine((data) => data.endDate >= data.startDate, {
    message: "End date cannot be before start date",
    path: ["endDate"],
  });
export type HolidayFormValues = z.infer<typeof holidayFormSchema>;

/* ---- Bookings ---- */

export const createBookingSchema = z.object({
  serviceId: z.string().min(1, "Select a service"),
  staffId: z.string().optional(),
  /** ISO 8601 datetime of the slot start. */
  startTime: z.string().min(1, "Select a time slot"),
  notes: z
    .string()
    .trim()
    .max(500, "Notes must be 500 characters or fewer")
    .optional(),
});
export type CreateBookingInput = z.infer<typeof createBookingSchema>;

export const updateBookingSchema = z.object({
  staffId: z.string().optional(),
  startTime: z.string().optional(),
  notes: z
    .string()
    .trim()
    .max(500, "Notes must be 500 characters or fewer")
    .optional(),
});
export type UpdateBookingInput = z.infer<typeof updateBookingSchema>;

export const bookingStatusUpdateSchema = z.object({
  status: z.enum(BOOKING_STATUSES),
  reason: z.string().trim().max(500).optional(),
});
export type BookingStatusUpdateInput = z.infer<
  typeof bookingStatusUpdateSchema
>;

export const cancelBookingSchema = z.object({
  reason: z
    .string()
    .trim()
    .max(500, "Reason must be 500 characters or fewer")
    .optional(),
});
export type CancelBookingInput = z.infer<typeof cancelBookingSchema>;

/** Parses booking list filters from URL search params, falling back to safe defaults. */
export const bookingFiltersSchema = z.object({
  page: z.coerce.number().int().min(1).catch(1),
  pageSize: z.coerce.number().int().min(1).max(100).catch(DEFAULT_PAGE_SIZE),
  search: z.string().optional().catch(undefined),
  status: z
    .enum(BOOKING_STATUSES)
    .or(z.literal("all"))
    .optional()
    .catch(undefined),
  dateFrom: z.string().regex(DATE_REGEX).optional().catch(undefined),
  dateTo: z.string().regex(DATE_REGEX).optional().catch(undefined),
  customerId: z.string().optional().catch(undefined),
  staffId: z.string().optional().catch(undefined),
  serviceId: z.string().optional().catch(undefined),
  sortBy: z.string().optional().catch(undefined),
  sortOrder: z.enum(["asc", "desc"]).optional().catch(undefined),
});
export type BookingFilters = z.infer<typeof bookingFiltersSchema>;

/* ---- Users ---- */

export const createUserSchema = z.object({
  firstName: z.string().trim().min(1, "First name is required").max(50),
  lastName: z.string().trim().min(1, "Last name is required").max(50),
  email: emailSchema,
  phone: optionalPhoneSchema,
  role: z.enum(USER_ROLES),
  password: passwordSchema,
  isActive: z.boolean(),
});
export type CreateUserInput = z.infer<typeof createUserSchema>;

export const updateUserSchema = z.object({
  firstName: z.string().trim().min(1, "First name is required").max(50),
  lastName: z.string().trim().min(1, "Last name is required").max(50),
  email: emailSchema,
  phone: optionalPhoneSchema,
  isActive: z.boolean(),
});
export type UpdateUserInput = z.infer<typeof updateUserSchema>;

export const updateRoleSchema = z.object({
  role: z.enum(USER_ROLES),
});
export type UpdateRoleInput = z.infer<typeof updateRoleSchema>;

/* ---- Payments, notifications, settings, reports ---- */

export const refundSchema = z.object({
  amount: z.coerce
    .number()
    .positive("Amount must be greater than zero")
    .optional(),
  reason: z
    .string()
    .trim()
    .max(500, "Reason must be 500 characters or fewer")
    .optional(),
});
export type RefundInput = z.infer<typeof refundSchema>;

/** Leave both `userId` and `role` empty to broadcast to everyone. */
export const sendNotificationSchema = z.object({
  userId: z.string().optional(),
  role: z.enum(USER_ROLES).optional(),
  title: z
    .string()
    .trim()
    .min(2, "Title is required")
    .max(120, "Title is too long"),
  message: z
    .string()
    .trim()
    .min(2, "Message is required")
    .max(1000, "Message is too long"),
  type: z.enum(NOTIFICATION_TYPES).optional(),
});
export type SendNotificationInput = z.infer<typeof sendNotificationSchema>;

export const settingsFormSchema = z.object({
  businessName: z.string().trim().min(1, "Business name is required").max(120),
  businessEmail: emailSchema.or(z.literal("")).optional(),
  businessPhone: optionalPhoneSchema,
  businessAddress: z.string().trim().max(300).optional(),
  timezone: z.string().min(1, "Select a timezone"),
  currency: z.string().length(3, "Use a 3-letter currency code").toUpperCase(),
  slotIntervalMinutes: z.coerce
    .number()
    .int()
    .min(5, "Minimum is 5 minutes")
    .max(240),
  bookingLeadTimeHours: z.coerce.number().min(0, "Cannot be negative").max(720),
  cancellationWindowHours: z.coerce
    .number()
    .min(0, "Cannot be negative")
    .max(720),
  maxAdvanceBookingDays: z.coerce
    .number()
    .int()
    .min(1, "Minimum is 1 day")
    .max(730),
  autoConfirmBookings: z.boolean(),
  allowCustomerCancellation: z.boolean(),
  emailNotificationsEnabled: z.boolean(),
  maintenanceMode: z.boolean(),
});
export type SettingsFormValues = z.infer<typeof settingsFormSchema>;

export const dateRangeSchema = z
  .object({
    dateFrom: isoDateSchema,
    dateTo: isoDateSchema,
  })
  .refine((range) => range.dateTo >= range.dateFrom, {
    message: "End date cannot be before start date",
    path: ["dateTo"],
  });
export type DateRangeInput = z.infer<typeof dateRangeSchema>;
