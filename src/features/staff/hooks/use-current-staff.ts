import { useProfile } from "@/features/auth/hooks/use-profile";
import { useStaffList } from "@/features/staff/hooks/use-staff";

/** Finds the staff record that belongs to the signed-in user (matched by user id, then by email). */
export function useCurrentStaff() {
  const profile = useProfile();
  const staff = useStaffList({ page: 1, pageSize: 100 });
  const user = profile.data;

  const member = user
    ? (staff.data?.items ?? []).find(
        (item) =>
          (item.userId !== null &&
            item.userId !== undefined &&
            item.userId === user.id) ||
          (Boolean(item.email) &&
            item.email?.toLowerCase() === user.email.toLowerCase()),
      )
    : undefined;

  return {
    member,
    isPending: profile.isPending || staff.isPending,
    isError: profile.isError || staff.isError,
    error: profile.error ?? staff.error,
    refetch: () => {
      void profile.refetch();
      void staff.refetch();
    },
  };
}
