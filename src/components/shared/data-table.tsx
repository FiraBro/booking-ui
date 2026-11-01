"use client";

import { ArrowDown, ArrowUp, ArrowUpDown } from "lucide-react";
import type { ReactNode } from "react";
import { DataTablePagination } from "@/components/shared/data-table-pagination";
import { EmptyState } from "@/components/shared/empty-state";
import { ErrorState } from "@/components/shared/error-state";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import type { PaginationMeta, SortOrder } from "@/types/api";

export interface DataTableColumn<T> {
  id: string;
  header: ReactNode;
  cell: (row: T, index: number) => ReactNode;
  /** Server-side sort key sent as sort_by. Omit for unsortable columns. */
  sortKey?: string;
  align?: "left" | "center" | "right";
  className?: string;
  /** Hides the column below the given breakpoint. */
  hideBelow?: "sm" | "md" | "lg";
}

export interface DataTableSort {
  sortBy?: string;
  sortOrder?: SortOrder;
}

export interface DataTablePaginationConfig {
  meta: PaginationMeta;
  onPageChange: (page: number) => void;
  onPageSizeChange?: (pageSize: number) => void;
  pageSizeOptions?: readonly number[];
}

export interface DataTableProps<T> {
  columns: DataTableColumn<T>[];
  data: T[] | undefined;
  getRowId: (row: T) => string;
  /** Accessible table description (visually hidden). */
  caption: string;
  isLoading?: boolean;
  isFetching?: boolean;
  error?: unknown;
  onRetry?: () => void;
  emptyState?: ReactNode;
  sort?: DataTableSort;
  onSortChange?: (sort: DataTableSort) => void;
  /** Supplying both selectedIds and onSelectedIdsChange turns on row selection. */
  selectedIds?: string[];
  onSelectedIdsChange?: (ids: string[]) => void;
  bulkActions?: (selectedIds: string[]) => ReactNode;
  pagination?: DataTablePaginationConfig;
  skeletonRows?: number;
  className?: string;
}

const ALIGN: Record<NonNullable<DataTableColumn<unknown>["align"]>, string> = {
  left: "text-left",
  center: "text-center",
  right: "text-right",
};

const HIDE_BELOW: Record<
  NonNullable<DataTableColumn<unknown>["hideBelow"]>,
  string
> = {
  sm: "hidden sm:table-cell",
  md: "hidden md:table-cell",
  lg: "hidden lg:table-cell",
};

function columnClass<T>(column: DataTableColumn<T>): string {
  return cn(
    ALIGN[column.align ?? "left"],
    column.hideBelow && HIDE_BELOW[column.hideBelow],
    column.className,
  );
}

function nextSort(
  current: DataTableSort | undefined,
  key: string,
): DataTableSort {
  if (current?.sortBy !== key) return { sortBy: key, sortOrder: "asc" };
  if (current.sortOrder === "asc") return { sortBy: key, sortOrder: "desc" };
  return { sortBy: undefined, sortOrder: undefined };
}

export function DataTable<T>({
  columns,
  data,
  getRowId,
  caption,
  isLoading,
  isFetching,
  error,
  onRetry,
  emptyState,
  sort,
  onSortChange,
  selectedIds,
  onSelectedIdsChange,
  bulkActions,
  pagination,
  skeletonRows = 6,
  className,
}: DataTableProps<T>) {
  const selectable = Boolean(selectedIds && onSelectedIdsChange);
  const selected = new Set(selectedIds ?? []);
  const rows = data ?? [];
  const pageIds = rows.map(getRowId);
  const allSelected =
    pageIds.length > 0 && pageIds.every((id) => selected.has(id));
  const someSelected = !allSelected && pageIds.some((id) => selected.has(id));
  const columnCount = columns.length + (selectable ? 1 : 0);

  function toggleAll() {
    if (!onSelectedIdsChange) return;
    if (allSelected) {
      onSelectedIdsChange(
        (selectedIds ?? []).filter((id) => !pageIds.includes(id)),
      );
    } else {
      onSelectedIdsChange(
        Array.from(new Set([...(selectedIds ?? []), ...pageIds])),
      );
    }
  }

  function toggleRow(id: string) {
    if (!onSelectedIdsChange) return;
    const next = new Set(selected);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    onSelectedIdsChange(Array.from(next));
  }

  if (error && data === undefined && !isLoading) {
    return <ErrorState error={error} onRetry={onRetry} className={className} />;
  }

  const showEmpty = !isLoading && rows.length === 0;

  return (
    <div className={cn("space-y-3", className)}>
      {selectable && bulkActions && (selectedIds?.length ?? 0) > 0 ? (
        <div
          className="flex flex-wrap items-center gap-3 rounded-lg border bg-muted/50 px-4 py-2"
          role="region"
          aria-label="Bulk actions"
        >
          <p className="text-sm font-medium">{selectedIds?.length} selected</p>
          <div className="flex flex-wrap items-center gap-2">
            {bulkActions(selectedIds ?? [])}
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="ml-auto"
            onClick={() => onSelectedIdsChange?.([])}
          >
            Clear selection
          </Button>
        </div>
      ) : null}

      <div className="rounded-lg border bg-card">
        <div
          aria-busy={isLoading || isFetching ? true : undefined}
          className={cn(
            "transition-opacity",
            isFetching && !isLoading && "opacity-60",
          )}
        >
          <Table>
            <TableCaption className="sr-only">{caption}</TableCaption>
            <TableHeader>
              <TableRow>
                {selectable ? (
                  <TableHead className="w-10">
                    <Checkbox
                      checked={
                        allSelected
                          ? true
                          : someSelected
                            ? "indeterminate"
                            : false
                      }
                      onCheckedChange={toggleAll}
                      disabled={rows.length === 0}
                      aria-label="Select all rows on this page"
                    />
                  </TableHead>
                ) : null}
                {columns.map((column) => {
                  const sortable = Boolean(column.sortKey && onSortChange);
                  const active = sortable && sort?.sortBy === column.sortKey;
                  const SortIcon = !active
                    ? ArrowUpDown
                    : sort?.sortOrder === "desc"
                      ? ArrowDown
                      : ArrowUp;

                  return (
                    <TableHead
                      key={column.id}
                      className={columnClass(column)}
                      aria-sort={
                        sortable
                          ? active
                            ? sort?.sortOrder === "desc"
                              ? "descending"
                              : "ascending"
                            : "none"
                          : undefined
                      }
                    >
                      {sortable && column.sortKey ? (
                        <Button
                          variant="ghost"
                          size="sm"
                          className={cn(
                            "-ml-3 h-8 gap-1",
                            column.align === "right" && "-mr-3 ml-0",
                            active && "text-foreground",
                          )}
                          onClick={() =>
                            onSortChange?.(
                              nextSort(sort, column.sortKey as string),
                            )
                          }
                        >
                          {column.header}
                          <SortIcon
                            className={cn("size-3.5", !active && "opacity-50")}
                            aria-hidden
                          />
                        </Button>
                      ) : (
                        column.header
                      )}
                    </TableHead>
                  );
                })}
              </TableRow>
            </TableHeader>

            <TableBody>
              {isLoading
                ? Array.from({ length: skeletonRows }, (_, row) => (
                    <TableRow
                      key={`skeleton-${row}`}
                      className="hover:bg-transparent"
                    >
                      {Array.from({ length: columnCount }, (_, cell) => (
                        <TableCell key={cell}>
                          <Skeleton className="h-5 w-full" />
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                : rows.map((row, index) => {
                    const id = getRowId(row);
                    const isSelected = selected.has(id);
                    return (
                      <TableRow
                        key={id}
                        data-state={isSelected ? "selected" : undefined}
                      >
                        {selectable ? (
                          <TableCell className="w-10">
                            <Checkbox
                              checked={isSelected}
                              onCheckedChange={() => toggleRow(id)}
                              aria-label={`Select row ${index + 1}`}
                            />
                          </TableCell>
                        ) : null}
                        {columns.map((column) => (
                          <TableCell
                            key={column.id}
                            className={columnClass(column)}
                          >
                            {column.cell(row, index)}
                          </TableCell>
                        ))}
                      </TableRow>
                    );
                  })}
            </TableBody>
          </Table>
        </div>

        {isLoading ? (
          <span role="status" className="sr-only">
            Loading…
          </span>
        ) : null}

        {showEmpty ? (
          <div className="p-4">
            {emptyState ?? (
              <EmptyState
                title="Nothing to show"
                description="No results match your current filters."
              />
            )}
          </div>
        ) : null}

        {pagination && !isLoading && rows.length > 0 ? (
          <div className="border-t px-4 py-3">
            <DataTablePagination
              meta={pagination.meta}
              onPageChange={pagination.onPageChange}
              onPageSizeChange={pagination.onPageSizeChange}
              pageSizeOptions={pagination.pageSizeOptions}
              disabled={isFetching}
            />
          </div>
        ) : null}
      </div>
    </div>
  );
}
