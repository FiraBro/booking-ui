import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { notify } from "@/components/shared/toast";
import { settingsApi } from "@/features/settings/api/settings.api";
import { queryKeys, STALE_TIME } from "@/lib/constants";
import type { SettingsFormValues } from "@/types";

export function useSettings() {
  return useQuery({
    queryKey: queryKeys.settings,
    queryFn: () => settingsApi.get(),
    staleTime: STALE_TIME.long,
  });
}

export function useUpdateSettings() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (values: SettingsFormValues) => settingsApi.update(values),
    onSuccess: (settings) => {
      notify.success("Settings saved");
      queryClient.setQueryData(queryKeys.settings, settings);
      // Slot length, lead time and booking window change what is bookable.
      void queryClient.invalidateQueries({
        queryKey: queryKeys.availability.all,
      });
    },
  });
}
