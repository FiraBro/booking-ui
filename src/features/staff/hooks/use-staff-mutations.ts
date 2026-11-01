import { useMutation, useQueryClient } from "@tanstack/react-query";
import { notify } from "@/components/shared/toast";
import { staffApi } from "@/features/staff/api/staff.api";
import { queryKeys } from "@/lib/constants";
import type {
  HolidayFormValues,
  ScheduleFormValues,
  StaffFormValues,
} from "@/types";

export function useCreateStaff() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (values: StaffFormValues) => staffApi.create(values),
    onSuccess: () => {
      notify.success("Staff member created");
      void queryClient.invalidateQueries({ queryKey: queryKeys.staff.all });
    },
  });
}

export function useUpdateStaff() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (vars: { id: string; values: StaffFormValues }) =>
      staffApi.update(vars.id, vars.values),
    onSuccess: (member, vars) => {
      notify.success("Staff member updated");
      queryClient.setQueryData(queryKeys.staff.detail(vars.id), member);
      void queryClient.invalidateQueries({ queryKey: queryKeys.staff.all });
    },
  });
}

export function useDeleteStaff() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => staffApi.remove(id),
    onSuccess: (_data, id) => {
      notify.success("Staff member deleted");
      queryClient.removeQueries({ queryKey: queryKeys.staff.detail(id) });
      void queryClient.invalidateQueries({ queryKey: queryKeys.staff.all });
      void queryClient.invalidateQueries({
        queryKey: queryKeys.availability.all,
      });
    },
  });
}

export function useSetStaffServices() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (vars: { id: string; serviceIds: string[] }) =>
      staffApi.setServices(vars.id, vars.serviceIds),
    onSuccess: (_data, vars) => {
      notify.success("Services updated");
      void queryClient.invalidateQueries({
        queryKey: queryKeys.staff.services(vars.id),
      });
      void queryClient.invalidateQueries({ queryKey: queryKeys.staff.all });
      void queryClient.invalidateQueries({
        queryKey: queryKeys.availability.all,
      });
    },
  });
}

export function useSaveStaffSchedule() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (vars: { id: string; values: ScheduleFormValues }) =>
      staffApi.saveSchedule(vars.id, vars.values),
    onSuccess: (_data, vars) => {
      notify.success("Working hours saved");
      void queryClient.invalidateQueries({
        queryKey: queryKeys.staff.schedule(vars.id),
      });
      void queryClient.invalidateQueries({
        queryKey: queryKeys.availability.all,
      });
    },
  });
}

export function useAddStaffHoliday() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (vars: { id: string; values: HolidayFormValues }) =>
      staffApi.addHoliday(vars.id, vars.values),
    onSuccess: (_data, vars) => {
      notify.success("Time off added");
      void queryClient.invalidateQueries({
        queryKey: queryKeys.staff.schedule(vars.id),
      });
      void queryClient.invalidateQueries({
        queryKey: queryKeys.availability.all,
      });
    },
  });
}
