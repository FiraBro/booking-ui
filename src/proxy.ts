import { NextResponse, type NextRequest } from "next/server";
import {
  canAccessPath,
  getHomeRoute,
  getSafeRedirect,
  isGuestOnlyPath,
  isProtectedPath,
  ROUTES,
} from "@/config/routes";
import { COOKIE_NAMES, parseUserRole } from "@/lib/constants";

/**
 * Edge guard. It only checks the presence of the session cookies and the advisory role cookie
 * to avoid flashing protected pages. The backend remains the source of truth: every API call is
 * authorised by the JWT, and an expired refresh token is handled by the client (silent refresh failure
 * clears the cookies and redirects to /login).
 */
export function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  const hasRefreshToken = Boolean(
    request.cookies.get(COOKIE_NAMES.refreshToken)?.value,
  );
  const role = parseUserRole(request.cookies.get(COOKIE_NAMES.role)?.value);
  const session = hasRefreshToken && role ? { role } : null;

  if (isProtectedPath(pathname)) {
    if (!session) {
      const loginUrl = new URL(ROUTES.login, request.url);
      loginUrl.searchParams.set("redirect", `${pathname}${search}`);
      return NextResponse.redirect(loginUrl);
    }
    if (!canAccessPath(session.role, pathname)) {
      return NextResponse.redirect(
        new URL(getHomeRoute(session.role), request.url),
      );
    }
    return NextResponse.next();
  }

  if (session && isGuestOnlyPath(pathname)) {
    const target = getSafeRedirect(
      request.nextUrl.searchParams.get("redirect"),
      session.role,
    );
    return NextResponse.redirect(new URL(target, request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)"],
};
