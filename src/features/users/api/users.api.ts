import { z } from "zod";
import { api } from "@/lib/api/client";
import { endpoints } from "@/lib/api/endpoints";
import { ApiError } from "@/lib/api/error";
import { extractId, unwrapKey } from "@/lib/api/helpers";
import type { UserRole } from "@/lib/constants";
import { removeEmptyValues } from "@/lib/utils";
import { userSchema } from "@/lib/validations/auth";
import type {
  CreateUserInput,
  ListParams,
  PaginatedResponse,
  UpdateUserInput,
  User,
} from "@/types";

export type UserListParams = ListParams & {
  role?: string;
  isActive?: boolean;
};

const userResponseSchema = z.preprocess(unwrapKey("user"), userSchema);

async function list(
  params: UserListParams = {},
): Promise<PaginatedResponse<User>> {
  return api.getPaginated<User>(endpoints.users.list, userSchema, {
    ...params,
  });
}

async function get(id: string): Promise<User> {
  return api.get<User>(endpoints.users.detail(id), {
    schema: userResponseSchema,
  });
}

async function parseUser(raw: unknown, knownId?: string): Promise<User> {
  const parsed = userResponseSchema.safeParse(raw);
  if (parsed.success) return parsed.data;
  const id = knownId ?? extractId(raw, "user");
  if (id) return get(id);
  throw new ApiError({ kind: "schema" });
}

async function create(values: CreateUserInput): Promise<User> {
  const raw = await api.post<unknown>(
    endpoints.users.create,
    removeEmptyValues({ ...values }),
  );
  return parseUser(raw);
}

async function update(id: string, values: UpdateUserInput): Promise<User> {
  const raw = await api.patch<unknown>(endpoints.users.detail(id), values);
  return parseUser(raw, id);
}

async function updateRole(id: string, role: UserRole): Promise<void> {
  await api.patch<unknown>(endpoints.users.role(id), { role });
}

async function remove(id: string): Promise<void> {
  await api.delete<unknown>(endpoints.users.detail(id));
}

export const usersApi = { list, get, create, update, updateRole, remove };
