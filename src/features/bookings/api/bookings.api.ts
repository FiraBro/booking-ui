import { z } from "zod";
import { api } from "@/lib/api/client";
import { endpoints } from "@/lib/api/endpoints";
import { ApiError } from "@/lib/api/error";
import { extractId, unwrapKey } from "@/lib/api/helpers";
import { removeEmptyValues } from "@/lib/utils";
import {
  availabilityResponseSchema,
  bookingSchema,
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

async function list(
  params: BookingListParams = {},
): Promise<PaginatedResponse<Booking>> {
  return api.getPaginated<Booking>(endpoints.bookings.list, bookingSchema, {
    ...params,
  });
}

/** GET /bookings/my: the signed-in customer's bookings. */
async function mine(
  params: BookingListParams = {},
): Promise<PaginatedResponse<Booking>> {
  return api.getPaginated<Booking>(endpoints.bookings.mine, bookingSchema, {
    ...params,
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
    startTime: input.startTime,
    notes: input.notes,
  });
  const raw = await api.post<unknown>(endpoints.bookings.create, payload);
  return parseBooking(raw);
}

async function update(id: string, input: UpdateBookingInput): Promise<Booking> {
  const raw = await api.patch<unknown>(
    endpoints.bookings.detail(id),
    removeEmptyValues({ ...input }),
  );
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

async function forService(
  serviceId: string,
  params: ServiceAvailabilityParams,
): Promise<AvailabilitySlot[]> {
  return api.get<AvailabilitySlot[]>(
    endpoints.availability.service(serviceId),
    {
      params: removeEmptyValues({ date: params.date, staffId: params.staffId }),
      schema: availabilityResponseSchema,
    },
  );
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
