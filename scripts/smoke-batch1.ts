import assert from "node:assert/strict";
import { canAccessPath, getSafeRedirect, isProtectedPath } from "@/config/routes";
import { ApiError } from "@/lib/api/error";
import { buildListParams, normalizePaginated } from "@/lib/api/types";
import { formatCurrency, formatDuration, humanize, toISODate } from "@/lib/format";
import { camelizeKeys, snakeizeKeys } from "@/lib/utils";
import {
  authResponseSchema,
  availabilityResponseSchema,
  availabilitySlotSchema,
  bookingSchema,
  registerSchema,
} from "@/lib/validations/auth";

let passed = 0;
function check(name: string, fn: () => void): void {
  try {
    fn();
    passed += 1;
    console.log(`  ok   ${name}`);
  } catch (error) {
    console.error(`  FAIL ${name}`);
    throw error;
  }
}

check("camelizeKeys / snakeizeKeys", () => {
  assert.deepEqual(camelizeKeys({ first_name: "a", nested: [{ access_token: "x" }] }), {
    firstName: "a",
    nested: [{ accessToken: "x" }],
  });
  assert.deepEqual(snakeizeKeys({ firstName: "a", dateFrom: "2026-01-01" }), {
    first_name: "a",
    date_from: "2026-01-01",
  });
});

check("normalizePaginated: meta envelope", () => {
  const { items, meta } = normalizePaginated({ data: [1, 2], meta: { page: 2, limit: 2, total: 5, totalPages: 3 } });
  assert.equal(items.length, 2);
  assert.deepEqual(meta, { page: 2, pageSize: 2, total: 5, totalPages: 3, hasNextPage: true, hasPreviousPage: true });
});

check("normalizePaginated: bare array", () => {
  const { meta } = normalizePaginated([1, 2, 3]);
  assert.equal(meta.total, 3);
  assert.equal(meta.totalPages, 1);
});

check("normalizePaginated: nested data.items + pagination", () => {
  const { items, meta } = normalizePaginated({ data: { items: [1], pagination: { page: 1, limit: 10, total: 1 } } });
  assert.equal(items.length, 1);
  assert.equal(meta.total, 1);
});

check("buildListParams drops empty and 'all'", () => {
  assert.deepEqual(buildListParams({ page: 2, pageSize: 20, sortBy: "createdAt", status: "all", search: "" }), {
    page: 2,
    limit: 20,
    sortBy: "createdAt",
  });
});

check("authResponseSchema: nested tokens + role normalisation", () => {
  const parsed = authResponseSchema.parse({
    tokens: { accessToken: "a", refreshToken: "r" },
    user: { id: 1, email: "a@b.co", role: "Admin" },
  });
  assert.equal(parsed.accessToken, "a");
  assert.equal(parsed.refreshToken, "r");
  assert.equal(parsed.user?.id, "1");
  assert.equal(parsed.user?.role, "admin");
});

check("availability slots: string, object, wrapped list", () => {
  assert.equal(availabilitySlotSchema.parse("09:00").startTime, "09:00");
  const slots = availabilityResponseSchema.parse({
    slots: [{ startTime: "2026-11-02T09:00:00Z", available: false }],
  });
  assert.equal(slots[0]?.isAvailable, false);
});

check("bookingSchema normalises status", () => {
  const booking = bookingSchema.parse({ id: 5, startTime: "2026-11-02T09:00:00Z", status: "In Progress" });
  assert.equal(booking.status, "in_progress");
  assert.equal(booking.id, "5");
});

check("registerSchema rejects mismatched passwords", () => {
  const result = registerSchema.safeParse({
    firstName: "A",
    lastName: "B",
    email: "a@b.co",
    password: "Passw0rdOK",
    confirmPassword: "different",
    acceptTerms: true,
  });
  assert.equal(result.success, false);
});

check("ApiError.fromResponse: validation + server", () => {
  const validation = ApiError.fromResponse(422, { message: "Validation failed", errors: { first_name: ["Required"] } });
  assert.equal(validation.kind, "validation");
  assert.deepEqual(validation.fieldErrors, { firstName: ["Required"] });
  const server = ApiError.fromResponse(500, "<html>boom</html>");
  assert.equal(server.kind, "server");
  assert.ok(!server.message.includes("<html>"));
});

check("route guards", () => {
  assert.equal(isProtectedPath("/customer"), true);
  assert.equal(isProtectedPath("/services/1"), false);
  assert.equal(canAccessPath("staff", "/admin/users"), false);
  assert.equal(canAccessPath("admin", "/admin/users"), true);
  assert.equal(getSafeRedirect("/admin/users", "customer"), "/customer/dashboard");
  assert.equal(getSafeRedirect("//evil.com", "admin"), "/admin/dashboard");
  assert.equal(getSafeRedirect("/login", "staff"), "/staff/dashboard");
  assert.equal(getSafeRedirect("/services/1", "customer"), "/services/1");
});

check("formatters", () => {
  assert.equal(formatCurrency(49.99, "USD"), "$49.99");
  assert.equal(formatDuration(90), "1h 30m");
  assert.equal(humanize("in_progress"), "In progress");
  assert.equal(toISODate(new Date(2026, 10, 2)), "2026-11-02");
});

console.log(`\n${passed} checks passed`);
