export interface LogListParams {
  [key: string]: unknown;
}

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

export interface LogItem {
  id: string;
  action: string;
  createdAt: string;
  message?: string | null;
  entity?: string | null;
  entityId?: string | null;
  level?: string | null;
  metadata?: Record<string, unknown> | null;
}

export interface PaginationMeta {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export interface PaginatedLogsResponse {
  meta: PaginationMeta;
  items: LogItem[];
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
  logs: async (_params: LogListParams): Promise<PaginatedLogsResponse> => ({
    meta: {
      page: 1,
      pageSize: 10,
      total: 0,
      totalPages: 0,
      hasNextPage: false,
      hasPreviousPage: false
    },
    items: []
  })
};
