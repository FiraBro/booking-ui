import { USER_ROLES, type UserRole } from "@/lib/constants";

export const ROUTES = {
  home: "/",
  services: "/services",
  serviceDetail: (serviceId: string) => `/services/${serviceId}`,
  login: "/login",
  register: "/register",
  forgotPassword: "/forgot-password",
  resetPassword: "/reset-password",

  customer: {
    dashboard: "/customer/dashboard",
    bookings: "/customer/bookings",
    newBooking: "/customer/bookings/new",
    bookNow: (serviceId: string) =>
      `/customer/bookings/new?serviceId=${encodeURIComponent(serviceId)}`,
    bookingDetail: (bookingId: string) => `/customer/bookings/${bookingId}`,
    profile: "/customer/profile",
    notifications: "/customer/notifications",
  },

  staff: {
    dashboard: "/staff/dashboard",
    schedule: "/staff/schedule",
    bookings: "/staff/bookings",
    services: "/staff/services",
    availability: "/staff/availability",
    profile: "/staff/profile",
    notifications: "/staff/notifications",
  },

  admin: {
    dashboard: "/admin/dashboard",
    users: "/admin/users",
    userDetail: (userId: string) => `/admin/users/${userId}`,
    services: "/admin/services",
    serviceDetail: (serviceId: string) => `/admin/services/${serviceId}`,
    staff: "/admin/staff",
    staffDetail: (staffId: string) => `/admin/staff/${staffId}`,
    bookings: "/admin/bookings",
    bookingDetail: (bookingId: string) => `/admin/bookings/${bookingId}`,
    payments: "/admin/payments",
    notifications: "/admin/notifications",
    reports: "/admin/reports",
    settings: "/admin/settings",
    logs: "/admin/logs",
  },
} as const;

/* -------------------------------------------------------------------------- */
/* Access rules                                                               */
/* -------------------------------------------------------------------------- */

export interface RouteRule {
  prefix: string;
  roles: readonly UserRole[];
}

/**
 * Anything not matching a rule is public (landing page, /services, auth pages).
 * Each role owns one top-level prefix: /customer, /staff and /admin.
 * Admins manage staff members through /admin/staff; /staff/* is the staff member's own workspace.
 */
export const PROTECTED_ROUTE_RULES: readonly RouteRule[] = [
  { prefix: "/admin", roles: ["admin"] },
  { prefix: "/staff", roles: ["staff"] },
  { prefix: "/customer", roles: ["customer"] },
];

/** Pages that signed-in users should not see (they get redirected to their home). */
export const GUEST_ONLY_PATHS: readonly string[] = [
  ROUTES.login,
  ROUTES.register,
  ROUTES.forgotPassword,
];

export const AUTH_PATHS: readonly string[] = [
  ...GUEST_ONLY_PATHS,
  ROUTES.resetPassword,
];

export const ROLE_HOME: Record<UserRole, string> = {
  customer: ROUTES.customer.dashboard,
  staff: ROUTES.staff.dashboard,
  admin: ROUTES.admin.dashboard,
};

/** Where each role manages its own profile and password. Admins do this from settings. */
export const ROLE_PROFILE: Record<UserRole, string> = {
  customer: ROUTES.customer.profile,
  staff: ROUTES.staff.profile,
  admin: ROUTES.admin.settings,
};

export const ROLE_NOTIFICATIONS: Record<UserRole, string> = {
  customer: ROUTES.customer.notifications,
  staff: ROUTES.staff.notifications,
  admin: ROUTES.admin.notifications,
};

/** Where each role views its bookings. */
export const ROLE_BOOKINGS: Record<UserRole, string> = {
  customer: ROUTES.customer.bookings,
  staff: ROUTES.staff.bookings,
  admin: ROUTES.admin.bookings,
};

function matchesPrefix(pathname: string, prefix: string): boolean {
  return pathname === prefix || pathname.startsWith(`${prefix}/`);
}

export function getRouteRule(pathname: string): RouteRule | undefined {
  return PROTECTED_ROUTE_RULES.find((rule) =>
    matchesPrefix(pathname, rule.prefix),
  );
}

export function isProtectedPath(pathname: string): boolean {
  return getRouteRule(pathname) !== undefined;
}

export function canAccessPath(role: UserRole, pathname: string): boolean {
  const rule = getRouteRule(pathname);
  return rule ? rule.roles.includes(role) : true;
}

export function isGuestOnlyPath(pathname: string): boolean {
  return GUEST_ONLY_PATHS.some((path) => matchesPrefix(pathname, path));
}

export function isAuthPath(pathname: string): boolean {
  return AUTH_PATHS.some((path) => matchesPrefix(pathname, path));
}

export function getHomeRoute(role: UserRole): string {
  return ROLE_HOME[role];
}

export function getProfileRoute(role: UserRole): string {
  return ROLE_PROFILE[role];
}

export function getNotificationsRoute(role: UserRole): string {
  return ROLE_NOTIFICATIONS[role];
}

export function getBookingsRoute(role: UserRole): string {
  return ROLE_BOOKINGS[role];
}

/** Every role the app knows about, re-exported for convenience in guards. */
export const ALL_ROLES: readonly UserRole[] = USER_ROLES;

/**
 * Validates a post-login redirect target: it must be a same-origin path the role may open.
 * Anything else resolves to the role's home route.
 */
export function getSafeRedirect(
  target: string | null | undefined,
  role: UserRole,
): string {
  if (
    !target ||
    !target.startsWith("/") ||
    target.startsWith("//") ||
    target.includes("\\")
  ) {
    return getHomeRoute(role);
  }
  const path = target.split(/[?#]/)[0] ?? "";
  if (isAuthPath(path)) return getHomeRoute(role);
  if (isProtectedPath(path) && !canAccessPath(role, path))
    return getHomeRoute(role);
  return target;
}
