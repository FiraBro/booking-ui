import { api } from "@/lib/api/client";
import { endpoints } from "@/lib/api/endpoints";
import type { UserRole } from "@/lib/constants";

export type CreateInvitationInput = {
  firstName: string;
  lastName: string;
  email: string;
  role: Extract<UserRole, "staff" | "admin">;
};

export async function createInvitation(input: CreateInvitationInput) {
  return api.post<unknown>(endpoints.users.invite, input);
}

export async function acceptInvitation(input: { token: string; password: string }) {
  return api.post<unknown>(endpoints.auth.acceptInvitation, input);
}
