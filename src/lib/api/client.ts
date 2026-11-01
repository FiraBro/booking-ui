import axios, {
  type AxiosRequestConfig,
  type InternalAxiosRequestConfig,
} from "axios";
import { z } from "zod";
import { COOKIE_NAMES, env } from "@/lib/constants";
import { endpoints } from "@/lib/api/endpoints";
import {
  ApiError,
  createSchemaError,
  normalizeApiError,
} from "@/lib/api/error";
import {
  buildListParams,
  normalizePaginated,
  unwrapData,
  type RefreshSessionResponse,
  type SessionAdoptRequest,
} from "@/lib/api/types";
import { camelizeKeys, isRecord, snakeizeKeys } from "@/lib/utils";
import type { ListParams, PaginatedResponse } from "@/types/api";

/* -------------------------------------------------------------------------- */
/* Access-token store (memory only; the refresh token lives in an httpOnly    */
/* cookie managed by the Next.js route handlers)                              */
/* -------------------------------------------------------------------------- */

let accessToken: string | null = null;
let refreshPromise: Promise<RefreshResult> | null = null;
const sessionExpiredListeners = new Set<() => void>();

export const tokenStore = {
  get: (): string | null => accessToken,
  set: (token: string | null): void => {
    accessToken = token;
  },
  clear: (): void => {
    accessToken = null;
  },
};

/** Registers a callback fired when the refresh token is rejected. Returns an unsubscribe function. */
export function subscribeSessionExpired(listener: () => void): () => void {
  sessionExpiredListeners.add(listener);
  return () => {
    sessionExpiredListeners.delete(listener);
  };
}

export function expireSession(): void {
  tokenStore.clear();
  sessionExpiredListeners.forEach((listener) => listener());
}

/** True when the readable role cookie exists, i.e. the browser probably has a refresh-token cookie. */
export function hasSessionHint(): boolean {
  if (typeof document === "undefined") return false;
  return document.cookie
    .split("; ")
    .some((cookie) => cookie.startsWith(`${COOKIE_NAMES.role}=`));
}

/* -------------------------------------------------------------------------- */
/* Silent refresh (single flight)                                             */
/* -------------------------------------------------------------------------- */

type RefreshResult =
  | { status: "ok"; token: string }
  | { status: "invalid" }
  | { status: "network" };

export function refreshSession(): Promise<RefreshResult> {
  if (!refreshPromise) {
    refreshPromise = (async (): Promise<RefreshResult> => {
      try {
        const response = await fetch(endpoints.bff.refresh, {
          method: "POST",
          credentials: "same-origin",
          cache: "no-store",
          headers: { Accept: "application/json" },
        });

        if (response.status === 401 || response.status === 403) {
          tokenStore.clear();
          return { status: "invalid" };
        }
        if (!response.ok) return { status: "network" };

        const data = camelizeKeys(
          await response.json(),
        ) as Partial<RefreshSessionResponse> | null;
        if (!data?.accessToken) {
          tokenStore.clear();
          return { status: "invalid" };
        }
        tokenStore.set(data.accessToken);
        return { status: "ok", token: data.accessToken };
      } catch {
        return { status: "network" };
      } finally {
        refreshPromise = null;
      }
    })();
  }
  return refreshPromise;
}

/** Returns the in-memory token, or tries a silent refresh when the browser has a session cookie. */
export async function ensureAccessToken(): Promise<string | null> {
  const existing = tokenStore.get();
  if (existing) return existing;
  if (!hasSessionHint()) return null;

  const result = await refreshSession();
  if (result.status === "ok") return result.token;
  if (result.status === "invalid") expireSession();
  return null;
}

/** Hands a freshly issued refresh token to the server so it can store it in an httpOnly cookie. */
export async function adoptSession(input: SessionAdoptRequest): Promise<void> {
  const response = await fetch(endpoints.bff.refresh, {
    method: "POST",
    credentials: "same-origin",
    cache: "no-store",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify(input),
  });
  if (!response.ok) {
    const body: unknown = await response.json().catch(() => null);
    throw ApiError.fromResponse(response.status, body);
  }
}

/** Clears the server-side session cookies. Failures are ignored on purpose. */
export async function clearServerSession(): Promise<void> {
  try {
    await fetch(endpoints.bff.logout, {
      method: "POST",
      credentials: "same-origin",
      cache: "no-store",
    });
  } catch {
    /* best effort */
  }
}

/* -------------------------------------------------------------------------- */
/* Axios instance                                                             */
/* -------------------------------------------------------------------------- */

const AUTH_PUBLIC_PATHS: readonly string[] = [
  endpoints.auth.login,
  endpoints.auth.register,
  endpoints.auth.refresh,
  endpoints.auth.forgotPassword,
  endpoints.auth.resetPassword,
];

function isAuthEndpoint(url: string | undefined): boolean {
  if (!url) return false;
  const path = url.replace(env.apiBaseUrl, "");
  return AUTH_PUBLIC_PATHS.some(
    (candidate) => path === candidate || path.startsWith(`${candidate}?`),
  );
}

type RetriableConfig = InternalAxiosRequestConfig & { _retry?: boolean };

export const apiClient = axios.create({
  baseURL: env.apiBaseUrl,
  timeout: 20_000,
  headers: { Accept: "application/json", "Content-Type": "application/json" },
  // key=a&key=b instead of key[]=a&key[]=b, which is what most Go routers expect
  paramsSerializer: { indexes: null },
});

apiClient.interceptors.request.use(async (config) => {
  if (!isAuthEndpoint(config.url)) {
    const token = await ensureAccessToken();
    if (token) config.headers.set("Authorization", `Bearer ${token}`);
  }
  if (config.data !== undefined) config.data = snakeizeKeys(config.data);
  if (config.params !== undefined) config.params = snakeizeKeys(config.params);
  return config;
});

apiClient.interceptors.response.use(
  (response) => {
    const type = response.config.responseType;
    if (type === undefined || type === "json") {
      response.data = camelizeKeys(response.data);
    }
    return response;
  },
  async (error: unknown) => {
    if (axios.isAxiosError(error)) {
      const original = error.config as RetriableConfig | undefined;

      if (
        error.response?.status === 401 &&
        original &&
        !original._retry &&
        !isAuthEndpoint(original.url) &&
        (tokenStore.get() || hasSessionHint())
      ) {
        original._retry = true;
        const result = await refreshSession();

        if (result.status === "ok") {
          original.headers.set("Authorization", `Bearer ${result.token}`);
          return apiClient(original);
        }
        if (result.status === "invalid") expireSession();
      }
    }
    return Promise.reject(normalizeApiError(error));
  },
);

/* -------------------------------------------------------------------------- */
/* Typed request helpers                                                      */
/* -------------------------------------------------------------------------- */

export type ResponseSchema<T> = z.ZodType<T, z.ZodTypeDef, unknown>;

export interface RequestOptions<T> extends Omit<
  AxiosRequestConfig,
  "url" | "method" | "data" | "params"
> {
  params?: Record<string, unknown>;
  schema?: ResponseSchema<T>;
}

function parseResponse<T>(
  payload: unknown,
  schema: ResponseSchema<T> | undefined,
  url: string,
): T {
  if (!schema) return payload as T;
  const result = schema.safeParse(payload);
  if (!result.success) throw createSchemaError(url, result.error);
  return result.data;
}

async function execute<T>(
  config: AxiosRequestConfig,
  schema?: ResponseSchema<T>,
): Promise<T> {
  const response = await apiClient.request<unknown>(config);
  return parseResponse(unwrapData(response.data), schema, config.url ?? "");
}

export const api = {
  get<T = unknown>(url: string, options: RequestOptions<T> = {}): Promise<T> {
    const { schema, ...config } = options;
    return execute<T>({ ...config, url, method: "GET" }, schema);
  },

  post<T = unknown>(
    url: string,
    data?: unknown,
    options: RequestOptions<T> = {},
  ): Promise<T> {
    const { schema, ...config } = options;
    return execute<T>({ ...config, url, method: "POST", data }, schema);
  },

  put<T = unknown>(
    url: string,
    data?: unknown,
    options: RequestOptions<T> = {},
  ): Promise<T> {
    const { schema, ...config } = options;
    return execute<T>({ ...config, url, method: "PUT", data }, schema);
  },

  patch<T = unknown>(
    url: string,
    data?: unknown,
    options: RequestOptions<T> = {},
  ): Promise<T> {
    const { schema, ...config } = options;
    return execute<T>({ ...config, url, method: "PATCH", data }, schema);
  },

  delete<T = unknown>(
    url: string,
    options: RequestOptions<T> & { data?: unknown } = {},
  ): Promise<T> {
    const { schema, ...config } = options;
    return execute<T>({ ...config, url, method: "DELETE" }, schema);
  },

  /** GET a list endpoint and return { items, meta } regardless of the backend envelope. */
  async getPaginated<T>(
    url: string,
    itemSchema: ResponseSchema<T>,
    params: ListParams & Record<string, unknown> = {},
    config: Omit<AxiosRequestConfig, "url" | "method" | "params"> = {},
  ): Promise<PaginatedResponse<T>> {
    const response = await apiClient.get<unknown>(url, {
      ...config,
      params: buildListParams(params),
    });
    const { items, meta } = normalizePaginated(response.data, {
      page: params.page,
      pageSize: params.pageSize,
    });
    const parsed = z.array(itemSchema).safeParse(items);
    if (!parsed.success) throw createSchemaError(url, parsed.error);
    return { items: parsed.data, meta };
  },

  /** GET a binary payload (e.g. CSV export). */
  async getBlob(
    url: string,
    params: Record<string, unknown> = {},
  ): Promise<Blob> {
    const response = await apiClient.get<Blob>(url, {
      params: buildListParams(params),
      responseType: "blob",
    });
    return response.data;
  },
};

export function isRefreshResponse(
  value: unknown,
): value is RefreshSessionResponse {
  return isRecord(value) && typeof value.accessToken === "string";
}
