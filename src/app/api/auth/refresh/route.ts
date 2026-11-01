import { NextResponse, type NextRequest } from "next/server";
import { endpoints } from "@/lib/api/endpoints";
import { unwrapData } from "@/lib/api/types";
import {
  COOKIE_NAMES,
  getServerApiBaseUrl,
  parseUserRole,
  type UserRole,
} from "@/lib/constants";
import { camelizeKeys, isRecord } from "@/lib/utils";
import {
  authResponseSchema,
  profileResponseSchema,
} from "@/lib/validations/auth";
import type { User } from "@/types";

const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 30;
const UPSTREAM_TIMEOUT_MS = 15_000;

/* -------------------------------------------------------------------------- */
/* Helpers                                                                    */
/* -------------------------------------------------------------------------- */

function json(body: unknown, status = 200): NextResponse {
  return NextResponse.json(body, {
    status,
    headers: { "Cache-Control": "no-store" },
  });
}

function cookieBase() {
  return {
    path: "/",
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
  };
}

function setRoleCookie(response: NextResponse, role: UserRole): void {
  response.cookies.set(COOKIE_NAMES.role, role, {
    ...cookieBase(),
    httpOnly: false,
    maxAge: SESSION_MAX_AGE_SECONDS,
  });
}

function setSessionCookies(
  response: NextResponse,
  refreshToken: string,
  role: UserRole,
): void {
  response.cookies.set(COOKIE_NAMES.refreshToken, refreshToken, {
    ...cookieBase(),
    httpOnly: true,
    maxAge: SESSION_MAX_AGE_SECONDS,
  });
  setRoleCookie(response, role);
}

function clearSessionCookies(response: NextResponse): void {
  response.cookies.set(COOKIE_NAMES.refreshToken, "", {
    ...cookieBase(),
    httpOnly: true,
    maxAge: 0,
  });
  response.cookies.set(COOKIE_NAMES.role, "", {
    ...cookieBase(),
    httpOnly: false,
    maxAge: 0,
  });
}

/** The refresh token is invalid: drop both cookies so proxy.ts stops treating the browser as signed in. */
function rejected(): NextResponse {
  const response = json(
    { message: "Your session has expired. Please sign in again." },
    401,
  );
  clearSessionCookies(response);
  return response;
}

function isSameOrigin(request: NextRequest): boolean {
  const origin = request.headers.get("origin");
  if (!origin) return true;
  const host =
    request.headers.get("x-forwarded-host") ?? request.headers.get("host");
  try {
    return new URL(origin).host === host;
  } catch {
    return false;
  }
}

async function readJsonBody(request: NextRequest): Promise<unknown> {
  if (!request.headers.get("content-type")?.includes("application/json"))
    return null;
  return request.json().catch(() => null);
}

async function fetchProfile(
  baseUrl: string,
  accessToken: string,
): Promise<User | null> {
  try {
    const response = await fetch(`${baseUrl}${endpoints.auth.profile}`, {
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      cache: "no-store",
      signal: AbortSignal.timeout(UPSTREAM_TIMEOUT_MS),
    });
    if (!response.ok) return null;
    const raw: unknown = await response.json().catch(() => null);
    const parsed = profileResponseSchema.safeParse(
      unwrapData(camelizeKeys(raw)),
    );
    return parsed.success ? parsed.data : null;
  } catch {
    return null;
  }
}

/* -------------------------------------------------------------------------- */
/* Silent refresh                                                             */
/* -------------------------------------------------------------------------- */

async function rotateSession(request: NextRequest): Promise<NextResponse> {
  const refreshToken = request.cookies.get(COOKIE_NAMES.refreshToken)?.value;
  if (!refreshToken) return rejected();

  const baseUrl = getServerApiBaseUrl();
  let upstream: Response;
  try {
    upstream = await fetch(`${baseUrl}${endpoints.auth.refresh}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({ refresh_token: refreshToken }),
      cache: "no-store",
      signal: AbortSignal.timeout(UPSTREAM_TIMEOUT_MS),
    });
  } catch {
    return json({ message: "The authentication service is unreachable." }, 502);
  }

  if (
    upstream.status === 400 ||
    upstream.status === 401 ||
    upstream.status === 403
  )
    return rejected();
  if (!upstream.ok)
    return json(
      { message: "The authentication service returned an error." },
      502,
    );

  const raw: unknown = await upstream.json().catch(() => null);
  const parsed = authResponseSchema.safeParse(unwrapData(camelizeKeys(raw)));
  if (!parsed.success)
    return json(
      { message: "Unexpected response from the authentication service." },
      502,
    );

  const { accessToken, refreshToken: rotatedToken } = parsed.data;
  let user: User | null = parsed.data.user ?? null;
  let role: UserRole | null =
    user?.role ?? parseUserRole(request.cookies.get(COOKIE_NAMES.role)?.value);

  if (!role) {
    user = await fetchProfile(baseUrl, accessToken);
    role = user?.role ?? null;
  }
  if (!role)
    return json({ message: "Unable to determine the account role." }, 502);

  const response = json({ accessToken, user, role });
  setSessionCookies(response, rotatedToken ?? refreshToken, role);
  return response;
}

/* -------------------------------------------------------------------------- */
/* POST /api/auth/refresh                                                     */
/*  - { refreshToken, role }  adopt tokens right after login/register         */
/*  - { role }                re-sync the advisory role cookie                */
/*  - (no body)               rotate the session using the httpOnly cookie    */
/* -------------------------------------------------------------------------- */

export async function POST(request: NextRequest): Promise<NextResponse> {
  if (!isSameOrigin(request))
    return json({ message: "Cross-origin requests are not allowed." }, 403);

  const body = await readJsonBody(request);
  const refreshToken =
    isRecord(body) && typeof body.refreshToken === "string"
      ? body.refreshToken.trim()
      : "";
  const role =
    isRecord(body) && typeof body.role === "string"
      ? parseUserRole(body.role)
      : null;

  if (refreshToken) {
    if (!role) return json({ message: "A valid role is required." }, 400);
    const response = json({ role });
    setSessionCookies(response, refreshToken, role);
    return response;
  }

  if (role) {
    if (!request.cookies.get(COOKIE_NAMES.refreshToken)?.value)
      return rejected();
    const response = json({ role });
    setRoleCookie(response, role);
    return response;
  }

  return rotateSession(request);
}
