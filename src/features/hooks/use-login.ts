import { useMutation, useQueryClient } from "@tanstack/react-query";
import { authApi } from "@/features/auth/api/auth.api";
import { queryKeys } from "@/lib/constants";
import type { LoginInput } from "@/types";

export function useLogin() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: LoginInput) => authApi.login(input),
    meta: { silent: true },
    onSuccess: (user) => {
      queryClient.removeQueries();
      queryClient.setQueryData(queryKeys.auth.profile, user);
    },
  });
}
