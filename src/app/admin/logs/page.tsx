"use client";

import { Info } from "lucide-react";
import { useState } from "react";
import {
  DataTable,
  type DataTableColumn,
} from "@/components/shared/data-table";
import {
  DateRangeFilter,
  type DateRangeValue,
} from "@/components/shared/date-range-filter";
import { EmptyState } from "@/components/shared/empty-state";
import { ErrorState } from "@/components/shared/error-state";
import { PageHeader } from "@/components/shared/page-header";
import { SearchInput } from "@/components/shared/search-input";
import { StatusBadge } from "@/components/shared/status-badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useLogs } from "@/features/settings/hooks/use-logs";
import { DEFAULT_PAGE_SIZE } from "@/lib/constants";
import { formatDateTime } from "@/lib/format";
import type { Log } from "@/types";

const ALL = "all";
const METHODS = ["POST", "PUT", "PATCH", "DELETE"] as const;

function LogDetailsDialog({ log, onClose }: { log: Log; onClose: () => void }) {
  return (
    <Dialog open onOpenChange={(open) => (open ? undefined : onClose())}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>{log.action || "Log entry"}</DialogTitle>
          <DialogDescription>{formatDateTime(log.createdAt)}</DialogDescription>
        </DialogHeader>
        <dl className="space-y-3 text-sm">
          {log.message ? (
            <div>
              <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Message
              </dt>
              <dd className="mt-1 whitespace-pre-wrap">{log.message}</dd>
            </div>
          ) : null}
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              User
            </dt>
            <dd className="mt-1">
              {log.userName ?? log.userEmail ?? log.role ?? "System"}
            </dd>
          </div>
          {log.method ||
          log.path ||
          log.route ||
          log.statusCode != null ||
          log.status != null ? (
            <div>
              <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Request
              </dt>
              <dd className="mt-1 break-all font-mono text-xs">
                {[
                  log.method?.toUpperCase(),
                  log.path ?? log.route,
                  log.statusCode ?? log.status,
                ]
                  .filter((value) => value != null && value !== "")
                  .join(" ") || "—"}
              </dd>
            </div>
          ) : null}
          {log.ip ?? log.ipAddress ? (
            <div>
              <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                IP address
              </dt>
              <dd className="mt-1 font-mono text-xs">
                {log.ip ?? log.ipAddress}
              </dd>
            </div>
          ) : null}
        </dl>
      </DialogContent>
    </Dialog>
  );
}

export default function AdminLogsPage() {
  const [search, setSearch] = useState("");
  const [userId, setUserId] = useState("");
  const [method, setMethod] = useState(ALL);
  const [status, setStatus] = useState("");
  const [range, setRange] = useState<DateRangeValue>({});
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState<number>(DEFAULT_PAGE_SIZE);
  const [selected, setSelected] = useState<Log | null>(null);
  const statusCode = Number(status);

  const query = useLogs({
    search,
    userId,
    method,
    statusCode:
      status && Number.isInteger(statusCode) && statusCode >= 100 && statusCode <= 599
        ? statusCode
        : undefined,
    dateFrom: range.dateFrom,
    dateTo: range.dateTo,
    page,
    pageSize,
    sortBy: "created_at",
    sortOrder: "desc",
  });
  const meta = query.data?.meta;

  const columns: DataTableColumn<Log>[] = [
    {
      id: "time",
      header: "Time",
      cell: (log) => (
        <span className="tabular whitespace-nowrap">
          {formatDateTime(log.createdAt)}
        </span>
      ),
    },
    {
      id: "method",
      header: "Method",
      cell: (log) => (
        <StatusBadge status={log.method?.toUpperCase() ?? "—"} />
      ),
    },
    {
      id: "action",
      header: "Action",
      cell: (log) => (
        <div className="min-w-0">
          <p className="truncate font-medium">
            {log.path || log.route || log.action || "—"}
          </p>
          {log.message || log.entity ? (
            <p className="truncate text-xs text-muted-foreground">
              {log.message ||
                `${log.entity}${log.entityId ? ` #${log.entityId}` : ""}`}
            </p>
          ) : null}
        </div>
      ),
    },
    {
      id: "status",
      header: "Status",
      cell: (log) => (
        <span className="tabular-nums">
          {log.statusCode ?? log.status ?? "—"}
        </span>
      ),
    },
    {
      id: "user",
      header: "User",
      hideBelow: "md",
      cell: (log) => (
        <div className="min-w-0">
          <p className="truncate">
            {log.userName ?? log.userEmail ?? log.role ?? "System"}
          </p>
          {log.userName && log.userEmail ? (
            <p className="truncate text-xs text-muted-foreground">
              {log.userEmail}
            </p>
          ) : log.userId ? (
            <p className="truncate font-mono text-xs text-muted-foreground">
              {log.userId}
            </p>
          ) : null}
        </div>
      ),
    },
    {
      id: "ip",
      header: "IP",
      hideBelow: "lg",
      cell: (log) => (
        <span className="font-mono text-xs">
          {log.ip ?? log.ipAddress ?? "—"}
        </span>
      ),
    },
    {
      id: "details",
      header: <span className="sr-only">Details</span>,
      align: "right",
      cell: (log) => (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setSelected(log)}
          aria-label={`View details for ${log.action || "log entry"}`}
        >
          Details
        </Button>
      ),
    },
  ];

  function resetPage<T>(setter: (value: T) => void) {
    return (value: T) => {
      setter(value);
      setPage(1);
    };
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Audit logs"
        description="A record of important actions across the system."
      />

      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
        <SearchInput
          value={search}
          onChange={resetPage(setSearch)}
          placeholder="Search logs"
        />
        <Input
          aria-label="Filter by user ID"
          value={userId}
          onChange={(event) => resetPage(setUserId)(event.target.value)}
          placeholder="User ID"
          className="w-full sm:w-40"
        />
        <Select value={method} onValueChange={resetPage(setMethod)}>
          <SelectTrigger
            aria-label="Filter by HTTP method"
            className="w-full sm:w-36"
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>All methods</SelectItem>
            {METHODS.map((value) => (
              <SelectItem key={value} value={value}>
                {value}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Input
          aria-label="Filter by HTTP status"
          type="number"
          min={100}
          max={599}
          value={status}
          onChange={(event) => resetPage(setStatus)(event.target.value)}
          placeholder="Status"
          className="w-full sm:w-28"
        />
        <DateRangeFilter
          value={range}
          onChange={resetPage(setRange)}
          placeholder="Any date"
        />
      </div>

      {query.error && query.data ? (
        <ErrorState
          error={query.error}
          title="Could not refresh audit logs"
          onRetry={() => void query.refetch()}
          className="p-4"
        />
      ) : null}

      <DataTable<Log>
        caption="Audit logs"
        columns={columns}
        data={query.data?.items}
        getRowId={(log) => log.id}
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
            icon={Info}
            title="No log entries"
            description="Nothing matches these filters."
          />
        }
      />

      {selected ? (
        <LogDetailsDialog log={selected} onClose={() => setSelected(null)} />
      ) : null}
    </div>
  );
}
