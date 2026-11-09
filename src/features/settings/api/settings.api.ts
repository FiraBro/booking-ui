export interface AppSettingsSchema {
  businessName: string;
  timezone: string;
  currency: string;
  slotIntervalMinutes: number;
  bookingLeadTimeHours: number;
  cancellationWindowHours: number;
  maxAdvanceBookingDays: number;
  autoConfirmBookings: boolean;
  allowCustomerCancellation: boolean;
  emailNotificationsEnabled: boolean;
  maintenanceMode: boolean;
  [key: string]: unknown;
}

export const settingsApi = {
  get: async (): Promise<AppSettingsSchema> => ({
    businessName: "",
    timezone: "UTC",
    currency: "USD",
    slotIntervalMinutes: 30,
    bookingLeadTimeHours: 24,
    cancellationWindowHours: 12,
    maxAdvanceBookingDays: 30,
    autoConfirmBookings: true,
    allowCustomerCancellation: true,
    emailNotificationsEnabled: true,
    maintenanceMode: false
  }),
  update: async (_values: unknown): Promise<unknown> => ({}),
};
