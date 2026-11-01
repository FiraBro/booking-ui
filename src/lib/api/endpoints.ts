/**
 * Every path here mirrors the Go backend contract exactly.
 * Paths are relative to NEXT_PUBLIC_API_BASE_URL.
 */
export const endpoints = {
  auth: {
    register: "/auth/register",
    login: "/auth/login",
    refresh: "/auth/refresh",
    logout: "/auth/logout",
    forgotPassword: "/auth/forgot-password",
    resetPassword: "/auth/reset-password",
    profile: "/auth/profile",
    changePassword: "/auth/change-password",
  },
  users: {
    list: "/users",
    create: "/users",
    detail: (id: string) => `/users/${id}`,
    role: (id: string) => `/users/${id}/role`,
  },
  services: {
    list: "/services",
    create: "/services",
    categories: "/services/categories",
    detail: (id: string) => `/services/${id}`,
  },
  staff: {
    list: "/staff",
    create: "/staff",
    detail: (id: string) => `/staff/${id}`,
    services: (id: string) => `/staff/${id}/services`,
    schedule: (id: string) => `/staff/${id}/schedule`,
    holidays: (id: string) => `/staff/${id}/holidays`,
  },
  availability: {
    service: (serviceId: string) => `/availability/services/${serviceId}`,
    staff: (staffId: string) => `/availability/staff/${staffId}`,
  },
  bookings: {
    list: "/bookings",
    create: "/bookings",
    mine: "/bookings/my",
    detail: (id: string) => `/bookings/${id}`,
    status: (id: string) => `/bookings/${id}/status`,
  },
  payments: {
    checkout: "/payments/checkout",
    /** Server-to-server only (payment provider -> backend). Never called by the frontend. */
    webhook: "/payments/webhook",
    status: (bookingId: string) => `/payments/${bookingId}/status`,
    refund: (bookingId: string) => `/payments/refund/${bookingId}`,
  },
  notifications: {
    list: "/notifications",
    send: "/notifications/send",
    read: (id: string) => `/notifications/${id}/read`,
  },
  reports: {
    bookings: "/reports/bookings",
    revenue: "/reports/revenue",
    services: "/reports/services",
    staffPerformance: "/reports/staff-performance",
    customers: "/reports/customers",
  },
  settings: {
    root: "/settings",
  },
  logs: {
    list: "/logs",
  },
  /** Same-origin Next.js route handlers that own the httpOnly refresh-token cookie. */
  bff: {
    refresh: "/api/auth/refresh",
    logout: "/api/auth/logout",
  },
} as const;
