"use client";

import { Trash2 } from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { ErrorState } from "@/components/shared/error-state";
import { PageSkeleton } from "@/components/shared/loading-skeleton";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { ROUTES } from "@/config/routes";
import { useProfile } from "@/features/auth/hooks/use-profile";
import {
  UserEditForm,
  UserRoleCard,
} from "@/features/users/components/user-edit-form";
import { useDeleteUser } from "@/features/users/hooks/use-user-mutations";
import { useUser } from "@/features/users/hooks/use-users";
import { getDisplayName } from "@/lib/format";

export default function AdminUserDetailPage() {
  const { userId } = useParams<{ userId: string }>();
  const router = useRouter();
  const me = useProfile().data;
  const query = useUser(userId);
  const remove = useDeleteUser();
  const [confirmOpen, setConfirmOpen] = useState(false);

  const back = { href: ROUTES.admin.users, label: "All users" };

  if (query.isPending) return <PageSkeleton />;

  if (query.isError || !query.data) {
    return (
      <div className="space-y-6">
        <PageHeader title="User" back={back} />
        <ErrorState error={query.error} onRetry={() => void query.refetch()} />
      </div>
    );
  }

  const user = query.data;
  const isSelf = user.id === me?.id;

  return (
    <div className="space-y-6">
      <PageHeader
        title={getDisplayName(user)}
        description={user.email}
        back={back}
        actions={
          <>
            <Button asChild variant="outline">
              <Link
                href={`${ROUTES.admin.bookings}?customerId=${encodeURIComponent(user.id)}`}
              >
                View bookings
              </Link>
            </Button>
            <Button
              variant="outline"
              className="text-destructive hover:text-destructive"
              disabled={isSelf}
              onClick={() => setConfirmOpen(true)}
            >
              <Trash2 aria-hidden />
              Delete
            </Button>
          </>
        }
      />

      <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
        <UserEditForm
          key={user.updatedAt ?? user.id}
          user={user}
          isSelf={isSelf}
        />
        <UserRoleCard key={`role-${user.role}`} user={user} isSelf={isSelf} />
      </div>

      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title={`Delete ${getDisplayName(user)}?`}
        description="This permanently removes the account. This can't be undone."
        confirmLabel="Delete user"
        variant="destructive"
        loading={remove.isPending}
        onConfirm={() =>
          remove.mutate(user.id, {
            onSuccess: () => router.replace(ROUTES.admin.users),
            onSettled: () => setConfirmOpen(false),
          })
        }
      />
    </div>
  );
}
