import { DEFAULT_PAGE_SIZE } from "@/lib/constants";
import type { UserRole } from "@/lib/constants";
import { isRecord } from "@/lib/utils";
import type { ListParams, PaginationMeta, QueryParams } from "@/types/api";
import type { User } from "@/types";

/* -------------------------------------------------------------------------- */
/* Session contracts with the Next.js route handlers (/api/auth/*)            */
/* -------------------------------------------------------------------------- */

/** Body of POST /api/auth/refresh when adopting tokens right after login/register. */
export interface SessionAdoptRequest {
  refreshToken: string;
  role: UserRole;
}

/** Response of POST /api/auth/refresh (silent refresh and adopt). */
export interface RefreshSessionResponse {
  accessToken: string;
  user?: User | null;
  role?: UserRole;
}

/* -------------------------------------------------------------------------- */
/* Response envelope adapters                                                 */
/* -------------------------------------------------------------------------- */

const ENVELOPE_KEYS = new Set(["data", "message", "success", "status", "code"]);

/** Unwraps `{ data: X }` style envelopes. Leaves anything else untouched. */
export function unwrapData(payload: unknown): unknown {
  if (
    isRecord(payload) &&
    "data" in payload &&
    Object.keys(payload).every((key) => ENVELOPE_KEYS.has(key))
  ) {
    return payload.data;
  }
  return payload;
}

function toNumber(value: unknown): number | undefined {
  if (value === undefined || value === null || value === "") return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function firstNumber(
  source: Record<string, unknown>,
  keys: string[],
): number | undefined {
  for (const key of keys) {
    const value = toNumber(source[key]);
    if (value !== undefined) return value;
  }
  return undefined;
}

const LIST_KEYS = ["data", "items", "results", "rows"] as const;

/**
 * Converts the backend's list envelope into { items, meta }. Supported shapes:
 *  - [ ... ]
 *  - { data: [...], meta: { page, limit, total, totalPages } }
 *  - { items: [...], total, page, pageSize }
 *  - { data: { items: [...], pagination: {...} } }
 */
export function normalizePaginated(
  raw: unknown,
  fallback: { page?: number; pageSize?: number } = {},
): { items: unknown[]; meta: PaginationMeta } {
  let items: unknown[] = [];
  let metaSource: Record<string, unknown> = {};

  if (Array.isArray(raw)) {
    items = raw;
  } else if (isRecord(raw)) {
    const list = LIST_KEYS.map((key) => raw[key]).find((candidate) =>
      Array.isArray(candidate),
    );

    if (Array.isArray(list)) {
      items = list;
    } else if (isRecord(raw.data)) {
      const inner = normalizePaginated(raw.data, fallback);
      const outerMeta = raw.meta ?? raw.pagination;
      return outerMeta && isRecord(outerMeta)
        ? normalizePaginated({ items: inner.items, ...outerMeta }, fallback)
        : inner;
    }

    const candidate = raw.meta ?? raw.pagination ?? raw.paging ?? raw;
    if (isRecord(candidate)) metaSource = candidate;
  }

  const pageSize =
    firstNumber(metaSource, ["limit", "pageSize", "perPage", "size"]) ??
    fallback.pageSize ??
    (items.length > 0 ? items.length : DEFAULT_PAGE_SIZE);
  const page =
    firstNumber(metaSource, ["page", "currentPage"]) ?? fallback.page ?? 1;
  const total =
    firstNumber(metaSource, ["total", "totalItems", "totalCount", "count"]) ??
    items.length;
  const totalPages =
    firstNumber(metaSource, ["totalPages", "pages", "lastPage"]) ??
    Math.max(1, Math.ceil(total / Math.max(pageSize, 1)));

  return {
    items,
    meta: {
      page,
      pageSize,
      total,
      totalPages,
      hasNextPage: page < totalPages,
      hasPreviousPage: page > 1,
    },
  };
}

/* -------------------------------------------------------------------------- */
/* Query parameter builders                                                   */
/* -------------------------------------------------------------------------- */

/**
 * Maps the app's list parameters to the backend's query string:
 *   page -> page, pageSize -> limit, sortBy -> sort_by, sortOrder -> sort_order, search -> search
 * Any extra keys are forwarded (and snake_cased by the client). Empty values and "all" are dropped.
 */
export function buildListParams(
  params: ListParams & Record<string, unknown> = {},
): QueryParams {
  const { page, pageSize, sortBy, sortOrder, search, ...rest } = params;
  const output: QueryParams = {};

  const assign = (key: string, value: unknown) => {
    if (
      value === undefined ||
      value === null ||
      value === "" ||
      value === "all"
    )
      return;
    if (Array.isArray(value)) {
      if (value.length > 0) output[key] = value as Array<string | number>;
      return;
    }
    if (value instanceof Date) {
      output[key] = value.toISOString();
      return;
    }
    if (
      typeof value === "string" ||
      typeof value === "number" ||
      typeof value === "boolean"
    ) {
      output[key] = value;
    }
  };

  assign("page", page);
  assign("limit", pageSize);
  assign("sortBy", sortBy);
  assign("sortOrder", sortOrder);
  assign("search", search);
  for (const [key, value] of Object.entries(rest)) assign(key, value);

  return output;
}
