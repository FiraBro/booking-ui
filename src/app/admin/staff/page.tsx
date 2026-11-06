"use client";

import { Eye, Plus, Trash2 } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import {
  DataTable,
  type DataTableColumn,
} from "@/components/shared/data-table";
import { EmptyState } from "@/components/shared/empty-state";
import { PageHeader } from "@/components/shared/page-header";
import { RowMenu } from "@/components/shared/row-menu";
import { SearchInput } from "@/components/shared/search-input";
import { StatusBadge } from "@/components/shared/status-badge";
import { Button } from "@/components/ui/button";
import { ROUTES } from "@/config/routes";
import { personName } from "@/features/bookings/lib/display";
import { StaffFormDialog } from "@/features/staff/components/staff-form";
import { useStaffList } from "@/features/staff/hooks/use-staff";
import { useDeleteStaff } from "@/features/staff/hooks/use-staff-mutations";
import { DEFAULT_PAGE_SIZE } from "@/lib/constants";
import type { Staff } from "@/types";

export default function AdminStaffPage() {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState<number>(DEFAULT_PAGE_SIZE);
  const [createOpen, setCreateOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Staff | null>(null);
  const remove = useDeleteStaff();

  const query = useStaffList({ search, page, pageSize });
  const meta = query.data?.meta;

  const columns: DataTableColumn<Staff>[] = [
    {
      id: "name",
      header: "Staff member",
      cell: (member) => (
        <div className="min-w-0">
          <Link
            href={ROUTES.admin.staffDetail(member.id)}
            className="font-medium hover:underline"
          >
            {personName(member)}
          </Link>
          {member.title ? (
            <p className="truncate text-xs text-muted-foreground">
              {member.title}
            </p>
          ) : null}
        </div>
      ),
    },
    {
      id: "contact",
      header: "Contact",
      hideBelow: "md",
      cell: (member) => (
        <div className="min-w-0">
          <p className="truncate">{member.email ?? "—"}</p>
          {member.phone ? (
            <p className="truncate text-xs text-muted-foreground">
              {member.phone}
            </p>
          ) : null}
        </div>
      ),
    },
    {
      id: "services",
      header: "Services",
      hideBelow: "sm",
      cell: (member) =>
        member.services?.length || member.serviceIds?.length || 0,
    },
    {
      id: "status",
      header: "Status",
      cell: (member) => (
        <StatusBadge status={member.isActive ? "active" : "inactive"} />
      ),
    },
    {
      id: "actions",
      header: <span className="sr-only">Actions</span>,
      align: "right",
      cell: (member) => (
        <RowMenu
          label={`Actions for ${personName(member)}`}
          items={[
            {
              key: "manage",
              label: "Manage",
              icon: Eye,
              href: ROUTES.admin.staffDetail(member.id),
            },
            {
              key: "delete",
              label: "Delete",
              icon: Trash2,
              destructive: true,
              separatorBefore: true,
              onSelect: () => setDeleteTarget(member),
            },
          ]}
        />
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Staff"
        description="Manage the people who deliver your services."
        actions={
          <Button onClick={() => setCreateOpen(true)}>
            <Plus aria-hidden />
            New staff member
          </Button>
        }
      />

      <SearchInput
        value={search}
        onChange={(next) => {
          setSearch(next);
          setPage(1);
        }}
        placeholder="Search staff"
      />

      <DataTable<Staff>
        caption="Staff"
        columns={columns}
        data={query.data?.items}
        getRowId={(member) => member.id}
        isLoading={query.isPending}
        isFetching={query.isFetching}
        error={query.error}
        onRetry={() => void query.refetch()}
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
            title={search ? "No staff match your search" : "No staff yet"}
            description={
              search ? "Try a different name." : "Add your first staff member."
            }
            action={
              search ? undefined : (
                <Button size="sm" onClick={() => setCreateOpen(true)}>
                  New staff member
                </Button>
              )
            }
          />
        }
      />

      {createOpen ? (
        <StaffFormDialog onClose={() => setCreateOpen(false)} />
      ) : null}

      <ConfirmDialog
        open={deleteTarget !== null}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
        title={`Delete ${deleteTarget ? personName(deleteTarget) : "staff member"}?`}
        description="Their future availability is removed. Past bookings keep their history."
        confirmLabel="Delete staff member"
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
