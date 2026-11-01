import { NextResponse, type NextRequest } from "next/server";
import { endpoints } from "@/lib/api/endpoints";
import { COOKIE_NAMES, getServerApiBaseUrl } from "@/lib/constants";

function cookieBase() {
  return {
    path: "/",
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
  };
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

export async function POST(request: NextRequest): Promise<NextResponse> {
  if (!isSameOrigin(request)) {
    return NextResponse.json(
      { message: "Cross-origin requests are not allowed." },
      { status: 403 },
    );
  }

  const refreshToken = request.cookies.get(COOKIE_NAMES.refreshToken)?.value;

  if (refreshToken) {
    try {
      const authorization = request.headers.get("authorization");
      await fetch(`${getServerApiBaseUrl()}${endpoints.auth.logout}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          ...(authorization ? { Authorization: authorization } : {}),
        },
        body: JSON.stringify({ refresh_token: refreshToken }),
        cache: "no-store",
        signal: AbortSignal.timeout(8_000),
      });
    } catch {
      /* revoking is best effort; the cookies are cleared regardless */
    }
  }

  const response = NextResponse.json(
    { ok: true },
    { headers: { "Cache-Control": "no-store" } },
  );
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
  return response;
}
