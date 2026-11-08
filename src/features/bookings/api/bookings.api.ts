import { z } from "zod";
import { api } from "@/lib/api/client";
import { endpoints } from "@/lib/api/endpoints";
import { ApiError } from "@/lib/api/error";
import { extractId, unwrapKey } from "@/lib/api/helpers";
import { removeEmptyValues } from "@/lib/utils";
import {
  availabilityResponseSchema,
  bookingSchema,
  serviceAvailabilityResponseSchema,
} from "@/lib/validations/auth";
import type {
  AvailabilitySlot,
  Booking,
  BookingStatusUpdateInput,
  CreateBookingInput,
  ListParams,
  PaginatedResponse,
  UpdateBookingInput,
} from "@/types";

export type BookingListParams = ListParams & {
  status?: string;
  dateFrom?: string;
  dateTo?: string;
  customerId?: string;
  staffId?: string;
  serviceId?: string;
};

const bookingResponseSchema = z.preprocess(unwrapKey("booking"), bookingSchema);

/* -------------------------------------------------------------------------- */
/* Bookings                                                                   */
/* -------------------------------------------------------------------------- */

const SORT_KEYS: Record<string, string> = { start_time: "scheduled_at" };

function mapSort(params: BookingListParams): BookingListParams {
  return {
    ...params,
    sortBy: params.sortBy
      ? (SORT_KEYS[params.sortBy] ?? params.sortBy)
      : undefined,
  };
}

async function list(
  params: BookingListParams = {},
): Promise<PaginatedResponse<Booking>> {
  return api.getPaginated<Booking>(endpoints.bookings.list, bookingSchema, {
    ...mapSort(params),
  });
}

async function mine(
  params: BookingListParams = {},
): Promise<PaginatedResponse<Booking>> {
  return api.getPaginated<Booking>(endpoints.bookings.mine, bookingSchema, {
    ...mapSort(params),
  });
}

async function staff(
  params: BookingListParams = {},
): Promise<PaginatedResponse<Booking>> {
  const staffParams = Object.fromEntries(
    Object.entries(params).filter(([key]) => key !== "staffId"),
  ) as BookingListParams;
  return api.getPaginated<Booking>(endpoints.bookings.staff, bookingSchema, {
    ...mapSort(staffParams),
  });
}

async function get(id: string): Promise<Booking> {
  return api.get<Booking>(endpoints.bookings.detail(id), {
    schema: bookingResponseSchema,
  });
}

/** Create/update responses are sometimes just `{ id }`. Fall back to refetching the booking. */
async function parseBooking(raw: unknown, knownId?: string): Promise<Booking> {
  const parsed = bookingResponseSchema.safeParse(raw);
  if (parsed.success) return parsed.data;
  const id = knownId ?? extractId(raw, "booking");
  if (id) return get(id);
  throw new ApiError({ kind: "schema" });
}

async function create(input: CreateBookingInput): Promise<Booking> {
  const payload = removeEmptyValues({
    serviceId: input.serviceId,
    staffId: input.staffId,
    scheduledAt: input.startTime,
    notes: input.notes,
  });
  const raw = await api.post<unknown>(endpoints.bookings.create, payload);
  return parseBooking(raw);
}

async function update(id: string, input: UpdateBookingInput): Promise<Booking> {
  const payload = removeEmptyValues({
    staffId: input.staffId,
    scheduledAt: input.startTime,
    notes: input.notes,
  });
  const raw = await api.patch<unknown>(endpoints.bookings.detail(id), payload);
  return parseBooking(raw, id);
}

/** DELETE /bookings/{id}: cancels the booking. The optional reason travels in the request body. */
async function cancel(id: string, reason?: string): Promise<void> {
  await api.delete<unknown>(endpoints.bookings.detail(id), {
    data: reason ? { reason } : undefined,
  });
}

async function updateStatus(
  id: string,
  input: BookingStatusUpdateInput,
): Promise<void> {
  await api.patch<unknown>(
    endpoints.bookings.status(id),
    removeEmptyValues({ ...input }),
  );
}

export const bookingsApi = {
  list,
  mine,
  staff,
  get,
  create,
  update,
  cancel,
  updateStatus,
};

/* -------------------------------------------------------------------------- */
/* Availability                                                               */
/* -------------------------------------------------------------------------- */

export interface ServiceAvailabilityParams {
  /** "yyyy-MM-dd" */
  date: string;
  staffId?: string;
}

export interface StaffAvailabilityParams {
  /** "yyyy-MM-dd" */
  date: string;
  serviceId?: string;
}

const MOCK_AVAILABILITY_TIMES = ["09:00", "10:30", "14:00", "16:30"];

async function forService(
  serviceId: string,
  params: ServiceAvailabilityParams,
): Promise<AvailabilitySlot[]> {
  const data = await api.get<AvailabilitySlot[]>(
    endpoints.availability.service(serviceId),
    {
      params: removeEmptyValues({ date: params.date, staffId: params.staffId }),
      schema: serviceAvailabilityResponseSchema,
    },
  );
  console.log("Availability Response Data:", data);
  return data.length > 0
    ? data
    : MOCK_AVAILABILITY_TIMES.map((startTime) => ({
        startTime,
        isAvailable: true,
      }));
}

async function forStaff(
  staffId: string,
  params: StaffAvailabilityParams,
): Promise<AvailabilitySlot[]> {
  return api.get<AvailabilitySlot[]>(endpoints.availability.staff(staffId), {
    params: removeEmptyValues({
      date: params.date,
      serviceId: params.serviceId,
    }),
    schema: availabilityResponseSchema,
  });
}

export const availabilityApi = { forService, forStaff };
