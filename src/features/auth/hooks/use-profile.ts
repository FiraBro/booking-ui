import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { authApi } from "@/features/auth/api/auth.api";
import { normalizeApiError } from "@/lib/api/error";
import { queryKeys, STALE_TIME } from "@/lib/constants";
import type { UpdateProfileInput } from "@/types";

export function useProfile() {
  return useQuery({
    queryKey: queryKeys.auth.profile,
    queryFn: () => authApi.getProfile(),
    staleTime: STALE_TIME.long,
  });
}

export function useUpdateProfile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: UpdateProfileInput) => authApi.updateProfile(input),
    meta: { silent: true },
    onSuccess: (user) => {
      queryClient.setQueryData(queryKeys.auth.profile, user);
      toast.success("Profile updated");
    },
    onError: (error) => {
      const normalized = normalizeApiError(error);
      if (normalized.kind === "cancelled") return;
      if (normalized.kind === "validation" && normalized.hasFieldErrors) return;
      toast.error(normalized.message);
    },
  });
}
