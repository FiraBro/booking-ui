import axios from "axios";
import type { FieldValues, Path, UseFormSetError } from "react-hook-form";
import type { ZodError } from "zod";
import { camelizeKeys, isRecord, toCamelCase } from "@/lib/utils";
import type { ApiErrorKind } from "@/types/api";

const DEFAULT_MESSAGES: Record<ApiErrorKind, string> = {
  network: "Unable to reach the server. Check your connection and try again.",
  timeout: "The request took too long. Please try again.",
  cancelled: "The request was cancelled.",
  bad_request: "The request could not be processed. Please check your input.",
  unauthorized: "Your session has expired. Please sign in again.",
  forbidden: "You don't have permission to perform this action.",
  not_found: "The requested resource could not be found.",
  conflict:
    "This action conflicts with the current state. Please refresh and try again.",
  validation: "Please correct the highlighted fields and try again.",
  rate_limited: "Too many requests. Please wait a moment and try again.",
  server: "The server ran into a problem. Please try again shortly.",
  schema: "The server returned an unexpected response.",
  unknown: "Something went wrong. Please try again.",
};

export interface ApiErrorInit {
  kind: ApiErrorKind;
  message?: string;
  status?: number | null;
  code?: string | null;
  fieldErrors?: Record<string, string[]>;
  details?: unknown;
}

export class ApiError extends Error {
  readonly kind: ApiErrorKind;
  readonly status: number | null;
  readonly code: string | null;
  readonly fieldErrors: Record<string, string[]>;
  readonly details: unknown;

  constructor(init: ApiErrorInit) {
    super(init.message?.trim() || DEFAULT_MESSAGES[init.kind]);
    this.name = "ApiError";
    this.kind = init.kind;
    this.status = init.status ?? null;
    this.code = init.code ?? null;
    this.fieldErrors = init.fieldErrors ?? {};
    this.details = init.details;
    Object.setPrototypeOf(this, new.target.prototype);
  }

  get hasFieldErrors(): boolean {
    return Object.keys(this.fieldErrors).length > 0;
  }

  static fromResponse(status: number, rawBody: unknown): ApiError {
    const body = camelizeKeys(rawBody);
    const fieldErrors = extractFieldErrors(body);
    const kind = kindFromStatus(status, Object.keys(fieldErrors).length > 0);
    const message = kind === "server" ? undefined : extractMessage(body);
    const code =
      isRecord(body) && typeof body.code === "string" ? body.code : null;
    return new ApiError({
      kind,
      status,
      message,
      code,
      fieldErrors,
      details: body,
    });
  }
}

function kindFromStatus(status: number, hasFieldErrors: boolean): ApiErrorKind {
  if (status === 400) return hasFieldErrors ? "validation" : "bad_request";
  if (status === 401) return "unauthorized";
  if (status === 403) return "forbidden";
  if (status === 404) return "not_found";
  if (status === 409) return "conflict";
  if (status === 422) return "validation";
  if (status === 429) return "rate_limited";
  if (status >= 500) return "server";
  return "unknown";
}

function extractMessage(body: unknown): string | undefined {
  if (typeof body === "string") {
    const text = body.trim();
    return text && text.length < 300 && !text.startsWith("<")
      ? text
      : undefined;
  }
  if (!isRecord(body)) return undefined;
  for (const key of ["message", "error", "detail", "title"]) {
    const value = body[key];
    if (typeof value === "string" && value.trim()) return value;
    if (
      isRecord(value) &&
      typeof value.message === "string" &&
      value.message.trim()
    ) {
      return value.message;
    }
  }
  return undefined;
}

function normalizeFieldName(name: string): string {
  const camel = toCamelCase(name.trim());
  return camel.charAt(0).toLowerCase() + camel.slice(1);
}

function toFieldErrors(source: unknown): Record<string, string[]> {
  const output: Record<string, string[]> = {};

  const add = (field: string, rawMessage: unknown) => {
    const messages = (
      Array.isArray(rawMessage) ? rawMessage : [rawMessage]
    ).filter(
      (item): item is string => typeof item === "string" && item.length > 0,
    );
    if (!field || messages.length === 0) return;
    const key = normalizeFieldName(field);
    output[key] = [...(output[key] ?? []), ...messages];
  };

  if (Array.isArray(source)) {
    for (const item of source) {
      if (!isRecord(item)) continue;
      add(
        String(item.field ?? item.path ?? item.name ?? ""),
        item.message ?? item.error ?? item.msg,
      );
    }
  } else if (isRecord(source)) {
    for (const [field, message] of Object.entries(source)) add(field, message);
  }
  return output;
}

function extractFieldErrors(body: unknown): Record<string, string[]> {
  if (!isRecord(body)) return {};
  for (const key of [
    "errors",
    "fieldErrors",
    "validationErrors",
    "fields",
    "details",
  ]) {
    const result = toFieldErrors(body[key]);
    if (Object.keys(result).length > 0) return result;
  }
  return {};
}

export function createSchemaError(url: string, error: ZodError): ApiError {
  if (process.env.NODE_ENV !== "production") {
    console.error(`[api] Unexpected response shape from ${url}`, error.issues);
  }
  return new ApiError({ kind: "schema", details: error.issues });
}

export function isApiError(error: unknown): error is ApiError {
  return error instanceof ApiError;
}

export function hasErrorKind(
  error: unknown,
  ...kinds: ApiErrorKind[]
): boolean {
  return isApiError(error) && kinds.includes(error.kind);
}

export function normalizeApiError(error: unknown): ApiError {
  if (error instanceof ApiError) return error;

  if (axios.isCancel(error)) {
    return new ApiError({ kind: "cancelled" });
  }

  if (axios.isAxiosError(error)) {
    if (!error.response) {
      const timedOut =
        error.code === "ECONNABORTED" || error.code === "ETIMEDOUT";
      return new ApiError({ kind: timedOut ? "timeout" : "network" });
    }
    return ApiError.fromResponse(error.response.status, error.response.data);
  }

  if (error instanceof Error) {
    return new ApiError({ kind: "unknown", message: error.message });
  }
  return new ApiError({ kind: "unknown" });
}

export function getErrorMessage(error: unknown, fallback?: string): string {
  const normalized = normalizeApiError(error);
  if (normalized.kind === "unknown" && fallback) return fallback;
  return normalized.message || fallback || DEFAULT_MESSAGES.unknown;
}

/** First message per field, convenient for rendering. */
export function getFieldErrors(error: unknown): Record<string, string> {
  const normalized = normalizeApiError(error);
  const output: Record<string, string> = {};
  for (const [field, messages] of Object.entries(normalized.fieldErrors)) {
    if (messages[0]) output[field] = messages[0];
  }
  return output;
}

/**
 * Pushes server-side field errors into a React Hook Form instance.
 * Returns true when at least one field error was applied.
 */
export function applyFieldErrors<T extends FieldValues>(
  error: unknown,
  setError: UseFormSetError<T>,
): boolean {
  const entries = Object.entries(normalizeApiError(error).fieldErrors);
  for (const [field, messages] of entries) {
    setError(field as Path<T>, { type: "server", message: messages[0] });
  }
  return entries.length > 0;
}
