import { z } from "zod";
import { api } from "@/lib/api/client";
import { endpoints } from "@/lib/api/endpoints";
import { ApiError } from "@/lib/api/error";
import { extractId, unwrapKey } from "@/lib/api/helpers";
import { removeEmptyValues } from "@/lib/utils";
import {
  listOf,
  serviceCategorySchema,
  serviceSchema,
} from "@/lib/validations/auth";
import type {
  ListParams,
  PaginatedResponse,
  Service,
  ServiceCategory,
  ServiceFormValues,
} from "@/types";

export type ServiceListParams = ListParams & {
  categoryId?: string;
  isActive?: boolean;
};

const serviceResponseSchema = z.preprocess(unwrapKey("service"), serviceSchema);
const categoriesResponseSchema = listOf(serviceCategorySchema);

async function list(
  params: ServiceListParams = {},
): Promise<PaginatedResponse<Service>> {
  return api.getPaginated<Service>(endpoints.services.list, serviceSchema, {
    ...params,
  });
}

async function get(id: string): Promise<Service> {
  return api.get<Service>(endpoints.services.detail(id), {
    schema: serviceResponseSchema,
  });
}

async function categories(): Promise<ServiceCategory[]> {
  return api.get<ServiceCategory[]>(endpoints.services.categories, {
    schema: categoriesResponseSchema,
  });
}

/** Create/update responses are sometimes just `{ id }`. Fall back to refetching the entity. */
async function parseService(raw: unknown, knownId?: string): Promise<Service> {
  const parsed = serviceResponseSchema.safeParse(raw);
  if (parsed.success) return parsed.data;
  const id = knownId ?? extractId(raw, "service");
  if (id) return get(id);
  throw new ApiError({ kind: "schema" });
}

async function create(values: ServiceFormValues): Promise<Service> {
  const raw = await api.post<unknown>(
    endpoints.services.create,
    removeEmptyValues(values),
  );
  return parseService(raw);
}

async function update(id: string, values: ServiceFormValues): Promise<Service> {
  const raw = await api.patch<unknown>(endpoints.services.detail(id), values);
  return parseService(raw, id);
}

async function remove(id: string): Promise<void> {
  await api.delete<unknown>(endpoints.services.detail(id));
}

export const servicesApi = { list, get, categories, create, update, remove };
