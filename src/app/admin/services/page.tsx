"use client";

import { Pencil, Plus, Trash2 } from "lucide-react";
import Link from "next/link";
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
import { ServiceFormDialog } from "@/features/services/components/service-form";
import { useServiceCategories } from "@/features/services/hooks/use-service-categories";
import { useDeleteService } from "@/features/services/hooks/use-service-mutations";
import { useServices } from "@/features/services/hooks/use-services";
import { DEFAULT_PAGE_SIZE } from "@/lib/constants";
import { formatCurrency, formatDuration } from "@/lib/format";
import type { Service } from "@/types";

const ALL = "all";

export default function AdminServicesPage() {
  const [search, setSearch] = useState("");
  const [categoryId, setCategoryId] = useState(ALL);
  const [status, setStatus] = useState(ALL);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState<number>(DEFAULT_PAGE_SIZE);
  const [sort, setSort] = useState<DataTableSort>({});
  const [createOpen, setCreateOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Service | null>(null);

  const categories = useServiceCategories();
  const remove = useDeleteService();
  const query = useServices({
    search,
    categoryId,
    isActive: status === ALL ? undefined : status === "active",
    page,
    pageSize,
    sortBy: sort.sortBy,
    sortOrder: sort.sortOrder,
  });
  const meta = query.data?.meta;
  const hasFilters = Boolean(search) || categoryId !== ALL || status !== ALL;

  function resetPage<T>(setter: (value: T) => void) {
    return (value: T) => {
      setter(value);
      setPage(1);
    };
  }

  const columns: DataTableColumn<Service>[] = [
    {
      id: "name",
      header: "Service",
      sortKey: "name",
      cell: (service) => (
        <Link
          href={ROUTES.admin.serviceDetail(service.id)}
          className="font-medium hover:underline"
        >
          {service.name}
        </Link>
      ),
    },
    {
      id: "category",
      header: "Category",
      hideBelow: "md",
      cell: (service) =>
        service.category ? (
          <Badge variant="secondary">{service.category.name}</Badge>
        ) : (
          <span className="text-muted-foreground">—</span>
        ),
    },
    {
      id: "duration",
      header: "Duration",
      hideBelow: "sm",
      sortKey: "duration_minutes",
      cell: (service) => formatDuration(service.durationMinutes),
    },
    {
      id: "price",
      header: "Price",
      sortKey: "price",
      align: "right",
      cell: (service) => (
        <span className="tabular">
          {formatCurrency(service.price, service.currency)}
        </span>
      ),
    },
    {
      id: "status",
      header: "Status",
      cell: (service) => (
        <StatusBadge status={service.isActive ? "active" : "inactive"} />
      ),
    },
    {
      id: "actions",
      header: <span className="sr-only">Actions</span>,
      align: "right",
      cell: (service) => (
        <RowMenu
          label={`Actions for ${service.name}`}
          items={[
            {
              key: "edit",
              label: "Edit",
              icon: Pencil,
              href: ROUTES.admin.serviceDetail(service.id),
            },
            {
              key: "delete",
              label: "Delete",
              icon: Trash2,
              destructive: true,
              separatorBefore: true,
              onSelect: () => setDeleteTarget(service),
            },
          ]}
        />
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Services"
        description="Create and manage what customers can book."
        actions={
          <Button onClick={() => setCreateOpen(true)}>
            <Plus aria-hidden />
            New service
          </Button>
        }
      />

      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
        <SearchInput
          value={search}
          onChange={resetPage(setSearch)}
          placeholder="Search services"
        />
        <Select value={categoryId} onValueChange={resetPage(setCategoryId)}>
          <SelectTrigger
            aria-label="Filter by category"
            className="w-full sm:w-48"
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>All categories</SelectItem>
            {(categories.data ?? []).map((category) => (
              <SelectItem key={category.id} value={category.id}>
                {category.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={status} onValueChange={resetPage(setStatus)}>
          <SelectTrigger
            aria-label="Filter by status"
            className="w-full sm:w-40"
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

      <DataTable<Service>
        caption="Services"
        columns={columns}
        data={query.data?.items}
        getRowId={(service) => service.id}
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
            title={
              hasFilters ? "No services match your filters" : "No services yet"
            }
            description={
              hasFilters
                ? "Try removing a filter."
                : "Add your first service so customers can book it."
            }
            action={
              hasFilters ? undefined : (
                <Button size="sm" onClick={() => setCreateOpen(true)}>
                  New service
                </Button>
              )
            }
          />
        }
      />

      {createOpen ? (
        <ServiceFormDialog onClose={() => setCreateOpen(false)} />
      ) : null}

      <ConfirmDialog
        open={deleteTarget !== null}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
        title={`Delete ${deleteTarget?.name ?? "service"}?`}
        description="Existing bookings keep their history, but the service can no longer be booked."
        confirmLabel="Delete service"
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
