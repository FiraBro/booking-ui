"use client";

import { X } from "lucide-react";
import { DateRangeFilter } from "@/components/shared/date-range-filter";
import { SearchInput } from "@/components/shared/search-input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { FilterPatch } from "@/features/bookings/hooks/use-booking-filters";
import { personName } from "@/features/bookings/lib/display";
import { useServices } from "@/features/services/hooks/use-services";
import { useStaffList } from "@/features/staff/hooks/use-staff";
import { BOOKING_STATUSES, BOOKING_STATUS_LABELS } from "@/lib/constants";
import type { BookingFilters } from "@/lib/validations/auth";

const ALL = "all";

interface Option {
  value: string;
  label: string;
}

function FilterSelect({
  label,
  allLabel,
  value,
  onChange,
  options,
}: {
  label: string;
  allLabel: string;
  value: string | undefined;
  onChange: (value: string | undefined) => void;
  options: Option[];
}) {
  return (
    <Select
      value={value ?? ALL}
      onValueChange={(next) => onChange(next === ALL ? undefined : next)}
    >
      <SelectTrigger aria-label={label} className="w-full sm:w-44">
        <SelectValue placeholder={allLabel} />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value={ALL}>{allLabel}</SelectItem>
        {options.map((option) => (
          <SelectItem key={option.value} value={option.value}>
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

function StaffFilter({
  value,
  onChange,
}: {
  value: string | undefined;
  onChange: (value: string | undefined) => void;
}) {
  const staff = useStaffList({ page: 1, pageSize: 100 });
  const options = (staff.data?.items ?? []).map((member) => ({
    value: member.id,
    label: personName(member),
  }));
  return (
    <FilterSelect
      label="Filter by staff"
      allLabel="All staff"
      value={value}
      onChange={onChange}
      options={options}
    />
  );
}

function ServiceFilter({
  value,
  onChange,
}: {
  value: string | undefined;
  onChange: (value: string | undefined) => void;
}) {
  const services = useServices({ page: 1, pageSize: 100 });
  const options = (services.data?.items ?? []).map((service) => ({
    value: service.id,
    label: service.name,
  }));
  return (
    <FilterSelect
      label="Filter by service"
      allLabel="All services"
      value={value}
      onChange={onChange}
      options={options}
    />
  );
}

interface BookingFilterBarProps {
  filters: BookingFilters;
  onChange: (patch: FilterPatch) => void;
  onReset: () => void;
  showStatusFilter?: boolean;
  showDateFilter?: boolean;
  showStaffFilter?: boolean;
  showServiceFilter?: boolean;
  searchPlaceholder?: string;
}

export function BookingFilterBar({
  filters,
  onChange,
  onReset,
  showStatusFilter = true,
  showDateFilter = true,
  showStaffFilter = false,
  showServiceFilter = false,
  searchPlaceholder = "Search bookings",
}: BookingFilterBarProps) {
  const status =
    filters.status && filters.status !== ALL ? filters.status : undefined;
  const hasActiveFilters = Boolean(
    filters.search ||
    status ||
    filters.dateFrom ||
    filters.dateTo ||
    filters.staffId ||
    filters.serviceId ||
    filters.customerId,
  );

  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
        <SearchInput
          value={filters.search ?? ""}
          onChange={(next) => onChange({ search: next })}
          placeholder={searchPlaceholder}
          aria-label="Search bookings"
        />

        {showStatusFilter ? (
          <FilterSelect
            label="Filter by status"
            allLabel="All statuses"
            value={status}
            onChange={(next) => onChange({ status: next })}
            options={BOOKING_STATUSES.map((value) => ({
              value,
              label: BOOKING_STATUS_LABELS[value],
            }))}
          />
        ) : null}

        {showStaffFilter ? (
          <StaffFilter
            value={filters.staffId}
            onChange={(next) => onChange({ staffId: next })}
          />
        ) : null}
        {showServiceFilter ? (
          <ServiceFilter
            value={filters.serviceId}
            onChange={(next) => onChange({ serviceId: next })}
          />
        ) : null}

        {showDateFilter ? (
          <DateRangeFilter
            value={{ dateFrom: filters.dateFrom, dateTo: filters.dateTo }}
            onChange={(range) =>
              onChange({ dateFrom: range.dateFrom, dateTo: range.dateTo })
            }
            placeholder="Any date"
          />
        ) : null}

        {hasActiveFilters ? (
          <Button type="button" variant="ghost" size="sm" onClick={onReset}>
            Reset filters
          </Button>
        ) : null}
      </div>

      {filters.customerId ? (
        <Badge variant="secondary" className="gap-1 pr-1">
          Filtered by customer
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="size-5"
            onClick={() => onChange({ customerId: undefined })}
            aria-label="Remove customer filter"
          >
            <X className="size-3" aria-hidden />
          </Button>
        </Badge>
      ) : null}
    </div>
  );
}
