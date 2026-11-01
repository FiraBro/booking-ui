import type { z } from "zod";
import type {
  authResponseSchema,
  availabilitySlotSchema,
  bookingSchema,
  bookingsReportSchema,
  checkoutSessionSchema,
  customersReportSchema,
  holidaySchema,
  logSchema,
  notificationSchema,
  paymentSchema,
  paymentStatusInfoSchema,
  revenueReportSchema,
  scheduleSchema,
  serviceCategorySchema,
  serviceSchema,
  serviceSummarySchema,
  servicesReportSchema,
  settingSchema,
  staffPerformanceReportSchema,
  staffSchema,
  staffSummarySchema,
  userSchema,
  userSummarySchema,
  workingHourSchema,
} from "@/lib/validations/auth";

export * from "./api";
export type {
  UserRole,
  BookingStatus,
  PaymentStatus,
  NotificationType,
} from "@/lib/constants";
export type {
  LoginInput,
  RegisterInput,
  ForgotPasswordInput,
  ResetPasswordInput,
  ChangePasswordInput,
  UpdateProfileInput,
  ServiceFormValues,
  StaffFormValues,
  StaffServicesFormValues,
  WorkingHourFormValues,
  ScheduleFormValues,
  HolidayFormValues,
  CreateBookingInput,
  UpdateBookingInput,
  BookingStatusUpdateInput,
  CancelBookingInput,
  BookingFilters,
  CreateUserInput,
  UpdateUserInput,
  UpdateRoleInput,
  RefundInput,
  SendNotificationInput,
  SettingsFormValues,
  DateRangeInput,
} from "@/lib/validations/auth";

/* Entities (inferred from the Zod schemas so runtime and compile-time never drift) */

export type UserSummary = z.infer<typeof userSummarySchema>;
export type User = z.infer<typeof userSchema>;

export type ServiceCategory = z.infer<typeof serviceCategorySchema>;
export type ServiceSummary = z.infer<typeof serviceSummarySchema>;
export type Service = z.infer<typeof serviceSchema>;

export type StaffSummary = z.infer<typeof staffSummarySchema>;
export type Staff = z.infer<typeof staffSchema>;
export type WorkingHour = z.infer<typeof workingHourSchema>;
export type Holiday = z.infer<typeof holidaySchema>;
export type Schedule = z.infer<typeof scheduleSchema>;

export type AvailabilitySlot = z.infer<typeof availabilitySlotSchema>;

export type Booking = z.infer<typeof bookingSchema>;

export type Payment = z.infer<typeof paymentSchema>;
export type CheckoutSession = z.infer<typeof checkoutSessionSchema>;
export type PaymentStatusInfo = z.infer<typeof paymentStatusInfoSchema>;

export type Notification = z.infer<typeof notificationSchema>;

export type BookingsReport = z.infer<typeof bookingsReportSchema>;
export type RevenueReport = z.infer<typeof revenueReportSchema>;
export type ServicesReport = z.infer<typeof servicesReportSchema>;
export type StaffPerformanceReport = z.infer<
  typeof staffPerformanceReportSchema
>;
export type CustomersReport = z.infer<typeof customersReportSchema>;
export type Report =
  | BookingsReport
  | RevenueReport
  | ServicesReport
  | StaffPerformanceReport
  | CustomersReport;

export type Setting = z.infer<typeof settingSchema>;
export type Log = z.infer<typeof logSchema>;
export type LogEntry = Log;

export type AuthResponse = z.infer<typeof authResponseSchema>;
