import { NextResponse, type NextRequest } from "next/server";
import { getServerApiBaseUrl } from "@/lib/constants";

const FORWARDED_HEADERS = ["authorization", "content-type", "accept", "x-request-id"];

async function proxy(request: NextRequest): Promise<NextResponse> {
  const { pathname, search } = request.nextUrl;
  const path = pathname.replace(/^\/backend/, "");

  const headers = new Headers();
  for (const name of FORWARDED_HEADERS) {
    const value = request.headers.get(name);
    if (value) headers.set(name, value);
  }

  const hasBody = request.method !== "GET" && request.method !== "HEAD";

  let upstream: Response;
  try {
    upstream = await fetch(`${getServerApiBaseUrl()}${path}${search}`, {
      method: request.method,
      headers,
      body: hasBody ? await request.arrayBuffer() : undefined,
      cache: "no-store",
      redirect: "manual",
      signal: AbortSignal.timeout(20_000),
    });
  } catch {
    return NextResponse.json({ message: "The API is unreachable." }, { status: 502 });
  }

  const responseHeaders = new Headers();
  const contentType = upstream.headers.get("content-type");
  if (contentType) responseHeaders.set("content-type", contentType);
  responseHeaders.set("cache-control", "no-store");

  const empty = upstream.status === 204 || upstream.status === 205 || upstream.status === 304;
  return new NextResponse(empty ? null : upstream.body, { status: upstream.status, headers: responseHeaders });
}

export {
  proxy as GET,
  proxy as POST,
  proxy as PUT,
  proxy as PATCH,
  proxy as DELETE,
};
