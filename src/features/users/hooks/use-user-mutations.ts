import { useMutation, useQueryClient } from "@tanstack/react-query";
import { notify } from "@/components/shared/toast";
import { usersApi } from "@/features/users/api/users.api";
import { queryKeys, type UserRole } from "@/lib/constants";
import type { CreateUserInput, UpdateUserInput } from "@/types";

export function useCreateUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (values: CreateUserInput) => usersApi.create(values),
    onSuccess: () => {
      notify.success("User created");
      void queryClient.invalidateQueries({ queryKey: queryKeys.users.all });
    },
  });
}

export function useUpdateUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (vars: { id: string; values: UpdateUserInput }) =>
      usersApi.update(vars.id, vars.values),
    onSuccess: (user, vars) => {
      notify.success("User updated");
      queryClient.setQueryData(queryKeys.users.detail(vars.id), user);
      void queryClient.invalidateQueries({ queryKey: queryKeys.users.all });
    },
  });
}

export function useUpdateUserRole() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (vars: { id: string; role: UserRole }) =>
      usersApi.updateRole(vars.id, vars.role),
    onSuccess: (_data, vars) => {
      notify.success("Role updated");
      void queryClient.invalidateQueries({ queryKey: queryKeys.users.all });
      void queryClient.invalidateQueries({
        queryKey: queryKeys.users.detail(vars.id),
      });
    },
  });
}

export function useDeleteUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => usersApi.remove(id),
    onSuccess: (_data, id) => {
      notify.success("User deleted");
      queryClient.removeQueries({ queryKey: queryKeys.users.detail(id) });
      void queryClient.invalidateQueries({ queryKey: queryKeys.users.all });
    },
  });
}
