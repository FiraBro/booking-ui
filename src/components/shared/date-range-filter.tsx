"use client";

import {
  endOfMonth,
  startOfDay,
  startOfMonth,
  startOfYear,
  subDays,
  subMonths,
} from "date-fns";
import { CalendarIcon, X } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { formatDate, fromISODate, toISODate } from "@/lib/format";
import { cn } from "@/lib/utils";

export interface DateRangeValue {
  dateFrom?: string;
  dateTo?: string;
}

interface DateRangeFilterProps {
  value: DateRangeValue;
  onChange: (value: DateRangeValue) => void;
  placeholder?: string;
  clearable?: boolean;
  disabled?: boolean;
  className?: string;
}

interface Draft {
  from?: Date;
  to?: Date;
}

interface Preset {
  label: string;
  range: () => { from: Date; to: Date };
}

const PRESETS: Preset[] = [
  {
    label: "Last 7 days",
    range: () => ({
      from: subDays(startOfDay(new Date()), 6),
      to: startOfDay(new Date()),
    }),
  },
  {
    label: "Last 30 days",
    range: () => ({
      from: subDays(startOfDay(new Date()), 29),
      to: startOfDay(new Date()),
    }),
  },
  {
    label: "This month",
    range: () => ({
      from: startOfMonth(new Date()),
      to: endOfMonth(new Date()),
    }),
  },
  {
    label: "Last month",
    range: () => {
      const previous = subMonths(new Date(), 1);
      return { from: startOfMonth(previous), to: endOfMonth(previous) };
    },
  },
  {
    label: "Year to date",
    range: () => ({
      from: startOfYear(new Date()),
      to: startOfDay(new Date()),
    }),
  },
];

export function DateRangeFilter({
  value,
  onChange,
  placeholder = "Select date range",
  clearable = true,
  disabled,
  className,
}: DateRangeFilterProps) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<Draft>({});

  const from = fromISODate(value.dateFrom) ?? undefined;
  const to = fromISODate(value.dateTo) ?? undefined;
  const hasValue = Boolean(from && to);

  function handleOpenChange(next: boolean) {
    if (next) setDraft({ from, to });
    setOpen(next);
  }

  function apply(range: { from: Date; to: Date }) {
    onChange({ dateFrom: toISODate(range.from), dateTo: toISODate(range.to) });
    setOpen(false);
  }

  const label =
    from && to ? `${formatDate(from)} – ${formatDate(to)}` : placeholder;

  return (
    <div className={cn("relative inline-flex", className)}>
      <Popover open={open} onOpenChange={handleOpenChange}>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="outline"
            disabled={disabled}
            className={cn(
              "justify-start gap-2 font-normal",
              hasValue && clearable && "pr-9",
              !hasValue && "text-muted-foreground",
            )}
          >
            <CalendarIcon className="size-4 shrink-0" aria-hidden />
            <span className="truncate">{label}</span>
          </Button>
        </PopoverTrigger>
        <PopoverContent align="start" className="w-auto p-0">
          <div className="flex flex-wrap gap-1 border-b p-2">
            {PRESETS.map((preset) => (
              <Button
                key={preset.label}
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => apply(preset.range())}
              >
                {preset.label}
              </Button>
            ))}
          </div>
          <Calendar
            mode="range"
            selected={
              draft.from ? { from: draft.from, to: draft.to } : undefined
            }
            defaultMonth={draft.from ?? from}
            onSelect={(range) => {
              const next: Draft = { from: range?.from, to: range?.to };
              setDraft(next);
              if (next.from && next.to) apply({ from: next.from, to: next.to });
            }}
            autoFocus
          />
        </PopoverContent>
      </Popover>

      {clearable && hasValue && !disabled ? (
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="absolute right-1 top-1/2 size-7 -translate-y-1/2 text-muted-foreground"
          onClick={() => onChange({ dateFrom: undefined, dateTo: undefined })}
          aria-label="Clear date range"
        >
          <X className="size-4" aria-hidden />
        </Button>
      ) : null}
    </div>
  );
}
