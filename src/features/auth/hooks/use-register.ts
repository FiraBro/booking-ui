import { useMutation, useQueryClient } from "@tanstack/react-query";
import { authApi } from "@/features/auth/api/auth.api";
import { queryKeys } from "@/lib/constants";
import type { RegisterInput } from "@/types";

export function useRegister() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: RegisterInput) => authApi.register(input),
    meta: { silent: true },
    onSuccess: (result) => {
      if (result.status === "signed_in") {
        queryClient.removeQueries();
        queryClient.setQueryData(queryKeys.auth.profile, result.user);
      }
    },
  });
}
