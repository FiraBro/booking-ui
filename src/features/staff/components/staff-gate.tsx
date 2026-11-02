"use client";

import { UserX } from "lucide-react";
import type { ReactNode } from "react";
import { EmptyState } from "@/components/shared/empty-state";
import { ErrorState } from "@/components/shared/error-state";
import { PageSkeleton } from "@/components/shared/loading-skeleton";
import { useCurrentStaff } from "@/features/staff/hooks/use-current-staff";
import type { Staff } from "@/types";

/** Resolves the signed-in user's staff record before rendering staff-only tools. */
export function StaffGate({
  children,
}: {
  children: (member: Staff) => ReactNode;
}) {
  const current = useCurrentStaff();

  if (current.isPending) return <PageSkeleton />;
  if (current.isError)
    return <ErrorState error={current.error} onRetry={current.refetch} />;
  if (!current.member) {
    return (
      <EmptyState
        icon={UserX}
        title="No staff profile found"
        description="Your account isn't linked to a staff profile yet. Ask an administrator to link it."
      />
    );
  }
  return <>{children(current.member)}</>;
}
