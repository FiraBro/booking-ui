import {
  adoptSession,
  api,
  clearServerSession,
  tokenStore,
} from "@/lib/api/client";
import { endpoints } from "@/lib/api/endpoints";
import { ApiError, isApiError } from "@/lib/api/error";
import { COOKIE_NAMES, type UserRole } from "@/lib/constants";
import { isRecord, removeEmptyValues } from "@/lib/utils";
import {
  authResponseSchema,
  profileResponseSchema,
} from "@/lib/validations/auth";
import type {
  AuthResponse,
  ChangePasswordInput,
  ForgotPasswordInput,
  LoginInput,
  RegisterInput,
  ResetPasswordInput,
  UpdateProfileInput,
  User,
} from "@/types";

export type RegisterResult =
  | { status: "signed_in"; user: User }
  | { status: "created" };

/* -------------------------------------------------------------------------- */
/* Helpers                                                                    */
/* -------------------------------------------------------------------------- */

function readRoleCookie(): string | null {
  if (typeof document === "undefined") return null;
  const entry = document.cookie
    .split("; ")
    .find((cookie) => cookie.startsWith(`${COOKIE_NAMES.role}=`));
  if (!entry) return null;
  return decodeURIComponent(entry.slice(COOKIE_NAMES.role.length + 1));
}

/** Keeps the advisory role cookie (read by proxy.ts) in line with the role the API reports. */
async function syncRoleCookie(role: UserRole): Promise<void> {
  try {
    await fetch(endpoints.bff.refresh, {
      method: "POST",
      credentials: "same-origin",
      cache: "no-store",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({ role }),
    });
  } catch {
    /* best effort */
  }
}

function hasServerMessage(details: unknown): boolean {
  if (!isRecord(details)) return false;
  for (const key of ["message", "error", "detail", "title"]) {
    const value = details[key];
    if (typeof value === "string" && value.trim().length > 0) return true;
  }
  return false;
}

/** A bare 401 from the login endpoint means bad credentials, not an expired session. */
function toLoginError(error: unknown): unknown {
  if (
    isApiError(error) &&
    error.kind === "unauthorized" &&
    !hasServerMessage(error.details)
  ) {
    return new ApiError({
      kind: "unauthorized",
      status: error.status,
      message: "Incorrect email or password.",
      details: error.details,
    });
  }
  return error;
}

/**
 * Stores the access token in memory, resolves the user, and hands the refresh token to the
 * Next.js route handler, which keeps it in an httpOnly cookie.
 */
async function establishSession(auth: AuthResponse): Promise<User> {
  tokenStore.set(auth.accessToken);
  try {
    const user =
      auth.user ??
      (await api.get<User>(endpoints.auth.profile, {
        schema: profileResponseSchema,
      }));
    if (!auth.refreshToken) {
      throw new ApiError({
        kind: "schema",
        message:
          "The server did not return a refresh token, so the session cannot be kept.",
      });
    }
    await adoptSession({ refreshToken: auth.refreshToken, role: user.role });
    return user;
  } catch (error) {
    tokenStore.clear();
    throw error;
  }
}

/* -------------------------------------------------------------------------- */
/* Endpoints                                                                  */
/* -------------------------------------------------------------------------- */

async function login(input: LoginInput): Promise<User> {
  let auth: AuthResponse;
  try {
    auth = await api.post<AuthResponse>(
      endpoints.auth.login,
      { email: input.email, password: input.password },
      { schema: authResponseSchema },
    );
  } catch (error) {
    throw toLoginError(error);
  }
  return establishSession(auth);
}

async function register(input: RegisterInput): Promise<RegisterResult> {
  const payload = removeEmptyValues({
    firstName: input.firstName,
    lastName: input.lastName,
    email: input.email,
    phone: input.phone,
    password: input.password,
  });
  const raw = await api.post<unknown>(endpoints.auth.register, payload);
  const parsed = authResponseSchema.safeParse(raw);
  if (parsed.success && parsed.data.refreshToken) {
    return { status: "signed_in", user: await establishSession(parsed.data) };
  }
  return { status: "created" };
}

async function logout(): Promise<void> {
  if (tokenStore.get()) {
    try {
      await api.post<unknown>(endpoints.auth.logout);
    } catch {
      /* the route handler below revokes the refresh token as well */
    }
  }
  tokenStore.clear();
  await clearServerSession();
}

async function getProfile(): Promise<User> {
  const user = await api.get<User>(endpoints.auth.profile, {
    schema: profileResponseSchema,
  });
  if (readRoleCookie() !== user.role) await syncRoleCookie(user.role);
  return user;
}

async function updateProfile(input: UpdateProfileInput): Promise<User> {
  const raw = await api.patch<unknown>(endpoints.auth.profile, {
    firstName: input.firstName,
    lastName: input.lastName,
    phone: input.phone ?? "",
  });
  const parsed = profileResponseSchema.safeParse(raw);
  return parsed.success ? parsed.data : getProfile();
}

async function changePassword(input: ChangePasswordInput): Promise<void> {
  await api.patch<unknown>(endpoints.auth.changePassword, {
    currentPassword: input.currentPassword,
    newPassword: input.newPassword,
  });
}

async function forgotPassword(input: ForgotPasswordInput): Promise<void> {
  await api.post<unknown>(endpoints.auth.forgotPassword, {
    email: input.email,
  });
}

async function resetPassword(input: ResetPasswordInput): Promise<void> {
  await api.post<unknown>(endpoints.auth.resetPassword, {
    token: input.token,
    password: input.password,
  });
}

export const authApi = {
  login,
  register,
  logout,
  getProfile,
  updateProfile,
  changePassword,
  forgotPassword,
  resetPassword,
};
