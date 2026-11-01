import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  if (typeof value !== "object" || value === null) return false;
  const proto = Object.getPrototypeOf(value);
  return proto === Object.prototype || proto === null;
}

const CAMEL_CANDIDATE = /^[A-Za-z][A-Za-z0-9]*(?:[_-][A-Za-z0-9]+)+$/;
const SNAKE_CANDIDATE = /^[A-Za-z][A-Za-z0-9]*$/;

/** "first_name" -> "firstName". Keys that are not snake/kebab identifiers (e.g. dates) are untouched. */
export function toCamelCase(key: string): string {
  if (!CAMEL_CANDIDATE.test(key)) return key;
  return key.replace(/[_-]+([A-Za-z0-9])/g, (_match, char: string) => char.toUpperCase());
}

/** "firstName" -> "first_name". Keys that are already snake_case or not identifiers are untouched. */
export function toSnakeCase(key: string): string {
  if (!SNAKE_CANDIDATE.test(key)) return key;
  return key.replace(/([a-z0-9])([A-Z])/g, "$1_$2").toLowerCase();
}

export function camelizeKeys(value: unknown): unknown {
  if (Array.isArray(value)) return value.map((item) => camelizeKeys(item));
  if (isPlainObject(value)) {
    const output: Record<string, unknown> = {};
    for (const [key, item] of Object.entries(value)) {
      output[toCamelCase(key)] = camelizeKeys(item);
    }
    return output;
  }
  return value;
}

export function snakeizeKeys(value: unknown): unknown {
  if (Array.isArray(value)) return value.map((item) => snakeizeKeys(item));
  if (isPlainObject(value)) {
    const output: Record<string, unknown> = {};
    for (const [key, item] of Object.entries(value)) {
      output[toSnakeCase(key)] = snakeizeKeys(item);
    }
    return output;
  }
  return value;
}

export function getInitials(name: string | null | undefined, fallback = "?"): string {
  if (!name) return fallback;
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return fallback;
  const first = parts[0]?.charAt(0) ?? "";
  const last = parts.length > 1 ? (parts[parts.length - 1]?.charAt(0) ?? "") : "";
  return `${first}${last}`.toUpperCase() || fallback;
}

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return `${text.slice(0, Math.max(0, maxLength - 1)).trimEnd()}…`;
}

/** Removes undefined, null and empty-string values from a shallow object. */
export function removeEmptyValues<T extends Record<string, unknown>>(input: T): Partial<T> {
  const output: Partial<T> = {};
  for (const [key, value] of Object.entries(input)) {
    if (value === undefined || value === null || value === "") continue;
    (output as Record<string, unknown>)[key] = value;
  }
  return output;
}

/** Builds a URL search string (without leading "?") skipping empty values. Arrays become repeated keys. */
export function buildQueryString(params: Record<string, unknown>): string {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === "" || value === "all") continue;
    if (Array.isArray(value)) {
      value.forEach((item) => {
        if (item !== undefined && item !== null && item !== "") search.append(key, String(item));
      });
      continue;
    }
    if (value instanceof Date) {
      search.set(key, value.toISOString());
      continue;
    }
    search.set(key, String(value));
  }
  return search.toString();
}

export function isBrowser(): boolean {
  return typeof window !== "undefined";
}
