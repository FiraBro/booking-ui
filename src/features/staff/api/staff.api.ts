import { z } from "zod";
import { api } from "@/lib/api/client";
import { endpoints } from "@/lib/api/endpoints";
import { ApiError } from "@/lib/api/error";
import { extractId, unwrapKey } from "@/lib/api/helpers";
import { removeEmptyValues } from "@/lib/utils";
import {
  scheduleResponseSchema,
  staffSchema,
  staffServicesResponseSchema,
} from "@/lib/validations/auth";
import type {
  HolidayFormValues,
  ListParams,
  PaginatedResponse,
  Schedule,
  ScheduleFormValues,
  Staff,
  StaffFormValues,
} from "@/types";

export type StaffListParams = ListParams & {
  serviceId?: string;
  isActive?: boolean;
};

const staffResponseSchema = z.preprocess(unwrapKey("staff"), staffSchema);

async function list(
  params: StaffListParams = {},
): Promise<PaginatedResponse<Staff>> {
  return api.getPaginated<Staff>(endpoints.staff.list, staffSchema, {
    ...params,
  });
}

async function get(id: string): Promise<Staff> {
  return api.get<Staff>(endpoints.staff.detail(id), {
    schema: staffResponseSchema,
  });
}

async function parseStaff(raw: unknown, knownId?: string): Promise<Staff> {
  const parsed = staffResponseSchema.safeParse(raw);
  if (parsed.success) return parsed.data;
  const id = knownId ?? extractId(raw, "staff");
  if (id) return get(id);
  throw new ApiError({ kind: "schema" });
}

async function create(values: StaffFormValues): Promise<Staff> {
  const raw = await api.post<unknown>(
    endpoints.staff.create,
    removeEmptyValues(values),
  );
  return parseStaff(raw);
}

async function update(id: string, values: StaffFormValues): Promise<Staff> {
  const raw = await api.patch<unknown>(endpoints.staff.detail(id), values);
  return parseStaff(raw, id);
}

async function remove(id: string): Promise<void> {
  await api.delete<unknown>(endpoints.staff.detail(id));
}

/** Ids of the services this staff member performs. */
async function getServices(id: string): Promise<string[]> {
  return api.get<string[]>(endpoints.staff.services(id), {
    schema: staffServicesResponseSchema,
  });
}

async function setServices(id: string, serviceIds: string[]): Promise<void> {
  await api.post<unknown>(endpoints.staff.services(id), { serviceIds });
}

async function getSchedule(id: string): Promise<Schedule> {
  return api.get<Schedule>(endpoints.staff.schedule(id), {
    schema: scheduleResponseSchema,
  });
}

async function saveSchedule(
  id: string,
  values: ScheduleFormValues,
): Promise<void> {
  await api.post<unknown>(endpoints.staff.schedule(id), {
    workingHours: values.workingHours.map((row) => ({
      dayOfWeek: row.dayOfWeek,
      isWorking: row.isWorking,
      startTime: row.startTime,
      endTime: row.endTime,
    })),
  });
}

async function addHoliday(
  id: string,
  values: HolidayFormValues,
): Promise<void> {
  await api.post<unknown>(endpoints.staff.holidays(id), {
    startDate: values.startDate,
    endDate: values.endDate,
    reason: values.reason ?? "",
  });
}

export const staffApi = {
  list,
  get,
  create,
  update,
  remove,
  getServices,
  setServices,
  getSchedule,
  saveSchedule,
  addHoliday,
};
