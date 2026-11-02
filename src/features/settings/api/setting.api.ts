import { api } from "@/lib/api/client";
import { endpoints } from "@/lib/api/endpoints";
import { logSchema, settingSchema } from "@/lib/validations/auth";
import type {
  ListParams,
  Log,
  PaginatedResponse,
  Setting,
  SettingsFormValues,
} from "@/types";

export type LogListParams = ListParams & {
  level?: string;
  entity?: string;
  dateFrom?: string;
  dateTo?: string;
};

async function get(): Promise<Setting> {
  return api.get<Setting>(endpoints.settings.root, { schema: settingSchema });
}

/** PATCH /settings, then re-read so the form always reflects what the server stored. */
async function update(values: SettingsFormValues): Promise<Setting> {
  await api.patch<unknown>(endpoints.settings.root, values);
  return get();
}

async function logs(
  params: LogListParams = {},
): Promise<PaginatedResponse<Log>> {
  return api.getPaginated<Log>(endpoints.logs.list, logSchema, { ...params });
}

export const settingsApi = { get, update, logs };
