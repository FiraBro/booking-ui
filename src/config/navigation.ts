import {
  BarChart3,
  Bell,
  Briefcase,
  CalendarCheck,
  CalendarClock,
  CalendarDays,
  CalendarPlus,
  Clock,
  CreditCard,
  LayoutDashboard,
  ListChecks,
  ScrollText,
  Search,
  Settings,
  User,
  UserCog,
  Users,
  type LucideIcon,
} from "lucide-react";
import type { UserRole } from "@/lib/constants";
import { ROUTES } from "@/config/routes";

export interface NavItem {
  title: string;
  href: string;
  icon: LucideIcon;
  /** Show the unread-notifications count on this item. */
  badge?: "notifications";
}

export interface NavSection {
  label?: string;
  items: NavItem[];
}

const CUSTOMER_NAV: NavSection[] = [
  {
    items: [
      {
        title: "Dashboard",
        href: ROUTES.customer.dashboard,
        icon: LayoutDashboard,
      },
      {
        title: "My bookings",
        href: ROUTES.customer.bookings,
        icon: CalendarDays,
      },
      {
        title: "Book a service",
        href: ROUTES.customer.newBooking,
        icon: CalendarPlus,
      },
      { title: "Browse services", href: ROUTES.services, icon: Search },
    ],
  },
  {
    label: "Account",
    items: [
      {
        title: "Notifications",
        href: ROUTES.customer.notifications,
        icon: Bell,
        badge: "notifications",
      },
      { title: "Profile", href: ROUTES.customer.profile, icon: User },
    ],
  },
];

const STAFF_NAV: NavSection[] = [
  {
    items: [
      {
        title: "Dashboard",
        href: ROUTES.staff.dashboard,
        icon: LayoutDashboard,
      },
      { title: "Schedule", href: ROUTES.staff.schedule, icon: CalendarClock },
      { title: "Bookings", href: ROUTES.staff.bookings, icon: CalendarCheck },
      { title: "My services", href: ROUTES.staff.services, icon: ListChecks },
      { title: "Availability", href: ROUTES.staff.availability, icon: Clock },
    ],
  },
  {
    label: "Account",
    items: [
      {
        title: "Notifications",
        href: ROUTES.staff.notifications,
        icon: Bell,
        badge: "notifications",
      },
      { title: "Profile", href: ROUTES.staff.profile, icon: User },
    ],
  },
];

const ADMIN_NAV: NavSection[] = [
  {
    items: [
      {
        title: "Dashboard",
        href: ROUTES.admin.dashboard,
        icon: LayoutDashboard,
      },
    ],
  },
  {
    label: "Management",
    items: [
      { title: "Bookings", href: ROUTES.admin.bookings, icon: CalendarCheck },
      { title: "Services", href: ROUTES.admin.services, icon: Briefcase },
      { title: "Staff", href: ROUTES.admin.staff, icon: UserCog },
      { title: "Users", href: ROUTES.admin.users, icon: Users },
      { title: "Payments", href: ROUTES.admin.payments, icon: CreditCard },
    ],
  },
  {
    label: "Insights",
    items: [
      { title: "Reports", href: ROUTES.admin.reports, icon: BarChart3 },
      {
        title: "Notifications",
        href: ROUTES.admin.notifications,
        icon: Bell,
        badge: "notifications",
      },
    ],
  },
  {
    label: "System",
    items: [
      { title: "Settings", href: ROUTES.admin.settings, icon: Settings },
      { title: "Audit logs", href: ROUTES.admin.logs, icon: ScrollText },
    ],
  },
];

export const NAVIGATION: Record<UserRole, NavSection[]> = {
  customer: CUSTOMER_NAV,
  staff: STAFF_NAV,
  admin: ADMIN_NAV,
};

export const PUBLIC_NAV: ReadonlyArray<{ title: string; href: string }> = [
  { title: "Home", href: ROUTES.home },
  { title: "Services", href: ROUTES.services },
];

export function getNavigation(role: UserRole): NavSection[] {
  return NAVIGATION[role];
}

function matchesHref(pathname: string, href: string): boolean {
  const path = href.split("?")[0] ?? href;
  return pathname === path || pathname.startsWith(`${path}/`);
}

/** Returns the most specific nav item for a pathname so e.g. /customer/bookings/new does not also highlight /customer/bookings. */
export function getActiveNavItem(
  role: UserRole,
  pathname: string,
): NavItem | undefined {
  let best: NavItem | undefined;
  for (const section of NAVIGATION[role]) {
    for (const item of section.items) {
      if (!matchesHref(pathname, item.href)) continue;
      if (!best || item.href.length > best.href.length) best = item;
    }
  }
  return best;
}
