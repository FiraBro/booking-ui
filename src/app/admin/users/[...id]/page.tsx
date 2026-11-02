"use client";

import { Eye, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import {
  DataTable,
  type DataTableColumn,
  type DataTableSort,
} from "@/components/shared/data-table";
import { EmptyState } from "@/components/shared/empty-state";
import { PageHeader } from "@/components/shared/page-header";
import { RowMenu } from "@/components/shared/row-menu";
import { SearchInput } from "@/components/shared/search-input";
import { StatusBadge } from "@/components/shared/status-badge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ROUTES } from "@/config/routes";
import { useProfile } from "@/features/auth/hooks/use-profile";
import { CreateUserDialog } from "@/features/users/components/create-user-dialog";
import { useDeleteUser } from "@/features/users/hooks/use-user-mutations";
import { useUsers } from "@/features/users/hooks/use-users";
import {
  DEFAULT_PAGE_SIZE,
  USER_ROLES,
  USER_ROLE_LABELS,
} from "@/lib/constants";
import { formatDate, getDisplayName } from "@/lib/format";
import type { User } from "@/types";

const ALL = "all";

export default function AdminUsersPage() {
  const me = useProfile().data;
  const [search, setSearch] = useState("");
  const [role, setRole] = useState(ALL);
  const [status, setStatus] = useState(ALL);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState<number>(DEFAULT_PAGE_SIZE);
  const [sort, setSort] = useState<DataTableSort>({
    sortBy: "created_at",
    sortOrder: "desc",
  });
  const [createOpen, setCreateOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<User | null>(null);
  const remove = useDeleteUser();

  const query = useUsers({
    search,
    role,
    isActive: status === ALL ? undefined : status === "active",
    page,
    pageSize,
    sortBy: sort.sortBy,
    sortOrder: sort.sortOrder,
  });
  const meta = query.data?.meta;
  const hasFilters = Boolean(search) || role !== ALL || status !== ALL;

  function resetPage<T>(setter: (value: T) => void) {
    return (value: T) => {
      setter(value);
      setPage(1);
    };
  }

  const columns: DataTableColumn<User>[] = [
    {
      id: "name",
      header: "User",
      cell: (user) => (
        <div className="min-w-0">
          <p className="truncate font-medium">{getDisplayName(user)}</p>
          <p className="truncate text-xs text-muted-foreground">{user.email}</p>
        </div>
      ),
    },
    {
      id: "role",
      header: "Role",
      cell: (user) => (
        <Badge variant="secondary">{USER_ROLE_LABELS[user.role]}</Badge>
      ),
    },
    {
      id: "status",
      header: "Status",
      cell: (user) => (
        <StatusBadge status={user.isActive ? "active" : "inactive"} />
      ),
    },
    {
      id: "created",
      header: "Joined",
      sortKey: "created_at",
      hideBelow: "md",
      cell: (user) => formatDate(user.createdAt),
    },
    {
      id: "actions",
      header: <span className="sr-only">Actions</span>,
      align: "right",
      cell: (user) => (
        <RowMenu
          label={`Actions for ${getDisplayName(user)}`}
          items={[
            {
              key: "view",
              label: "View and edit",
              icon: Eye,
              href: ROUTES.admin.userDetail(user.id),
            },
            {
              key: "delete",
              label: "Delete",
              icon: Trash2,
              destructive: true,
              separatorBefore: true,
              disabled: user.id === me?.id,
              onSelect: () => setDeleteTarget(user),
            },
          ]}
        />
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Users"
        description="Manage accounts and roles."
        actions={
          <Button onClick={() => setCreateOpen(true)}>
            <Plus aria-hidden />
            New user
          </Button>
        }
      />

      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
        <SearchInput
          value={search}
          onChange={resetPage(setSearch)}
          placeholder="Search by name or email"
        />
        <Select value={role} onValueChange={resetPage(setRole)}>
          <SelectTrigger aria-label="Filter by role" className="w-full sm:w-44">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>All roles</SelectItem>
            {USER_ROLES.map((value) => (
              <SelectItem key={value} value={value}>
                {USER_ROLE_LABELS[value]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={status} onValueChange={resetPage(setStatus)}>
          <SelectTrigger
            aria-label="Filter by status"
            className="w-full sm:w-44"
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>All statuses</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <DataTable<User>
        caption="Users"
        columns={columns}
        data={query.data?.items}
        getRowId={(user) => user.id}
        isLoading={query.isPending}
        isFetching={query.isFetching}
        error={query.error}
        onRetry={() => void query.refetch()}
        sort={sort}
        onSortChange={(next) => {
          setSort(next);
          setPage(1);
        }}
        pagination={
          meta
            ? {
                meta,
                onPageChange: setPage,
                onPageSizeChange: (next) => {
                  setPageSize(next);
                  setPage(1);
                },
              }
            : undefined
        }
        emptyState={
          <EmptyState
            title={hasFilters ? "No users match your filters" : "No users yet"}
            description={
              hasFilters
                ? "Try removing a filter."
                : "Create the first user to get started."
            }
            action={
              hasFilters ? undefined : (
                <Button size="sm" onClick={() => setCreateOpen(true)}>
                  New user
                </Button>
              )
            }
          />
        }
      />

      {createOpen ? (
        <CreateUserDialog onClose={() => setCreateOpen(false)} />
      ) : null}

      <ConfirmDialog
        open={deleteTarget !== null}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
        title={`Delete ${deleteTarget ? getDisplayName(deleteTarget) : "user"}?`}
        description="This permanently removes the account. This can't be undone."
        confirmLabel="Delete user"
        variant="destructive"
        loading={remove.isPending}
        onConfirm={() => {
          if (deleteTarget)
            remove.mutate(deleteTarget.id, {
              onSettled: () => setDeleteTarget(null),
            });
        }}
      />
    </div>
  );
}
