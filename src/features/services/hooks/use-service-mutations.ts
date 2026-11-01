import { useMutation, useQueryClient } from "@tanstack/react-query";
import { notify } from "@/components/shared/toast";
import { servicesApi } from "@/features/services/api/services.api";
import { queryKeys } from "@/lib/constants";
import type { ServiceFormValues } from "@/types";

export function useCreateService() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (values: ServiceFormValues) => servicesApi.create(values),
    onSuccess: () => {
      notify.success("Service created");
      void queryClient.invalidateQueries({ queryKey: queryKeys.services.all });
      void queryClient.invalidateQueries({
        queryKey: queryKeys.services.categories,
      });
    },
  });
}

export function useUpdateService() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (vars: { id: string; values: ServiceFormValues }) =>
      servicesApi.update(vars.id, vars.values),
    onSuccess: (service, vars) => {
      notify.success("Service updated");
      queryClient.setQueryData(queryKeys.services.detail(vars.id), service);
      void queryClient.invalidateQueries({ queryKey: queryKeys.services.all });
      void queryClient.invalidateQueries({
        queryKey: queryKeys.availability.all,
      });
    },
  });
}

export function useDeleteService() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => servicesApi.remove(id),
    onSuccess: (_data, id) => {
      notify.success("Service deleted");
      queryClient.removeQueries({ queryKey: queryKeys.services.detail(id) });
      void queryClient.invalidateQueries({ queryKey: queryKeys.services.all });
      void queryClient.invalidateQueries({
        queryKey: queryKeys.services.categories,
      });
    },
  });
}
