import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { ROUTES } from "@/config/routes";
import { authApi } from "@/features/auth/api/auth.api";

export function useLogout() {
  const router = useRouter();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => authApi.logout(),
    meta: { silent: true },
    onSettled: () => {
      void queryClient.cancelQueries();
      router.replace(ROUTES.login);
    },
  });
}
