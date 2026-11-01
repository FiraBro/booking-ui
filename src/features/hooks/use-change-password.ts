import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { authApi } from "@/features/auth/api/auth.api";
import { normalizeApiError } from "@/lib/api/error";
import type { ChangePasswordInput } from "@/types";

export function useChangePassword() {
  return useMutation({
    mutationFn: (input: ChangePasswordInput) => authApi.changePassword(input),
    meta: { silent: true },
    onSuccess: () => {
      toast.success("Password updated");
    },
    onError: (error) => {
      const normalized = normalizeApiError(error);
      if (normalized.kind === "cancelled") return;
      if (normalized.kind === "validation" && normalized.hasFieldErrors) return;
      toast.error(normalized.message);
    },
  });
}
