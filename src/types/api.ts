export const API_ERROR_KINDS = [
  "network",
  "timeout",
  "cancelled",
  "bad_request",
  "unauthorized",
  "forbidden",
  "not_found",
  "conflict",
  "validation",
  "rate_limited",
  "server",
  "schema",
  "unknown",
] as const;

export type ApiErrorKind = (typeof API_ERROR_KINDS)[number];

export interface PaginationMeta {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export interface PaginatedResponse<T> {
  items: T[];
  meta: PaginationMeta;
}

export interface PaginationParams {
  page?: number;
  pageSize?: number;
}

export type SortOrder = "asc" | "desc";

export interface SortParams {
  sortBy?: string;
  sortOrder?: SortOrder;
}

export interface ListParams extends PaginationParams, SortParams {
  search?: string;
}

export type QueryParamValue =
  | string
  | number
  | boolean
  | Array<string | number>;
export type QueryParams = Record<string, QueryParamValue>;

export interface MessageResponse {
  message?: string | null;
}

export interface DateRangeParams {
  dateFrom?: string;
  dateTo?: string;
}
