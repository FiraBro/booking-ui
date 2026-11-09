import { api } from "@/lib/api/client";
import { endpoints } from "@/lib/api/endpoints";
import { ApiError } from "@/lib/api/error";
import { extractId } from "@/lib/api/helpers";
import { removeEmptyValues } from "@/lib/utils";
import { serviceSchema } from "@/lib/validations/auth";
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

async function list(
  params: ServiceListParams = {},
): Promise<PaginatedResponse<Service>> {
  const { categoryId, ...rest } = params;
  return api.getPaginated<Service>(endpoints.services.list, serviceSchema, {
    ...rest,
    category: categoryId,
  });
}

async function listAll(
  params: Omit<ServiceListParams, "page" | "pageSize" | "search"> = {},
): Promise<Service[]> {
  const pageSize = 100;
  const firstPage = await list({ ...params, page: 1, pageSize });
  const services = [...firstPage.items];

  for (let page = 2; page <= firstPage.meta.totalPages; page += 1) {
    const result = await list({ ...params, page, pageSize });
    services.push(...result.items);
  }

  return services;
}

async function get(id: string): Promise<Service> {
  return api.get<Service>(endpoints.services.detail(id), {
    schema: serviceSchema,
  });
}

async function categories(): Promise<ServiceCategory[]> {
  return api.get<ServiceCategory[]>(endpoints.services.categories);
}

/** Create/update responses are sometimes just `{ id }`. Fall back to refetching the entity. */
async function parseService(raw: unknown, knownId?: string): Promise<Service> {
  if (
    raw !== null &&
    typeof raw === "object" &&
    !Array.isArray(raw) &&
    "name" in raw
  ) {
    return serviceSchema.parse(raw);
  }
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

export const servicesApi = {
  list,
  listAll,
  get,
  categories,
  create,
  update,
  remove,
};
