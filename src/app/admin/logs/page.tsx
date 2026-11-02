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
import { PageHeader } from "@/components/shared/page-header";
import { SearchInput } from "@/components/shared/search-input";
import { StatusBadge } from "@/components/shared/status-badge";
import { Button } from "@/components/ui/button";
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
const LEVELS = ["info", "warning", "error"] as const;

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
              {log.userName ?? log.userEmail ?? "System"}
            </dd>
          </div>
          {log.ipAddress ? (
            <div>
              <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                IP address
              </dt>
              <dd className="mt-1 font-mono text-xs">{log.ipAddress}</dd>
            </div>
          ) : null}
          {log.metadata ? (
            <div>
              <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Metadata
              </dt>
              <dd className="mt-1">
                <pre className="max-h-64 overflow-auto rounded-md bg-muted p-3 text-xs">
                  {JSON.stringify(log.metadata, null, 2)}
                </pre>
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
  const [level, setLevel] = useState(ALL);
  const [range, setRange] = useState<DateRangeValue>({});
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState<number>(DEFAULT_PAGE_SIZE);
  const [selected, setSelected] = useState<Log | null>(null);

  const query = useLogs({
    search,
    level,
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
      id: "level",
      header: "Level",
      cell: (log) => <StatusBadge status={log.level ?? "info"} />,
    },
    {
      id: "action",
      header: "Action",
      cell: (log) => (
        <div className="min-w-0">
          <p className="truncate font-medium">{log.action || "—"}</p>
          {log.entity ? (
            <p className="truncate text-xs text-muted-foreground">
              {log.entity}
              {log.entityId ? ` #${log.entityId}` : ""}
            </p>
          ) : null}
        </div>
      ),
    },
    {
      id: "user",
      header: "User",
      hideBelow: "md",
      cell: (log) =>
        log.userName ??
        log.userEmail ?? <span className="text-muted-foreground">System</span>,
    },
    {
      id: "ip",
      header: "IP",
      hideBelow: "lg",
      cell: (log) => (
        <span className="font-mono text-xs">{log.ipAddress ?? "—"}</span>
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
        <Select value={level} onValueChange={resetPage(setLevel)}>
          <SelectTrigger
            aria-label="Filter by level"
            className="w-full sm:w-40"
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>All levels</SelectItem>
            {LEVELS.map((value) => (
              <SelectItem key={value} value={value}>
                {value.charAt(0).toUpperCase() + value.slice(1)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <DateRangeFilter
          value={range}
          onChange={resetPage(setRange)}
          placeholder="Any date"
        />
      </div>

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
