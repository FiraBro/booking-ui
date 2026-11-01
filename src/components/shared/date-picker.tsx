"use client";

import { CalendarIcon, X } from "lucide-react";
import { useState } from "react";
import type { Matcher } from "react-day-picker";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { formatLongDate, fromISODate, toISODate } from "@/lib/format";
import { cn } from "@/lib/utils";

interface DatePickerProps {
  /** Date as "yyyy-MM-dd". */
  value?: string;
  onChange: (value: string | undefined) => void;
  placeholder?: string;
  minDate?: Date;
  maxDate?: Date;
  /** Return true to disable a specific day (days off, holidays, fully booked days). */
  disabledDates?: (date: Date) => boolean;
  disabled?: boolean;
  clearable?: boolean;
  id?: string;
  "aria-invalid"?: boolean;
  "aria-describedby"?: string;
  className?: string;
}

export function DatePicker({
  value,
  onChange,
  placeholder = "Pick a date",
  minDate,
  maxDate,
  disabledDates,
  disabled,
  clearable,
  id,
  "aria-invalid": ariaInvalid,
  "aria-describedby": ariaDescribedBy,
  className,
}: DatePickerProps) {
  const [open, setOpen] = useState(false);
  const selected = fromISODate(value) ?? undefined;

  const matchers: Matcher[] = [];
  if (minDate) matchers.push({ before: minDate });
  if (maxDate) matchers.push({ after: maxDate });
  if (disabledDates) matchers.push(disabledDates);

  return (
    <div className={cn("relative", className)}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            id={id}
            type="button"
            variant="outline"
            disabled={disabled}
            aria-invalid={ariaInvalid}
            aria-describedby={ariaDescribedBy}
            className={cn(
              "w-full justify-start gap-2 text-left font-normal",
              clearable && selected && "pr-9",
              !selected && "text-muted-foreground",
            )}
          >
            <CalendarIcon className="size-4 shrink-0" aria-hidden />
            <span className="truncate">
              {selected ? formatLongDate(selected) : placeholder}
            </span>
          </Button>
        </PopoverTrigger>
        <PopoverContent align="start" className="w-auto p-0">
          <Calendar
            mode="single"
            selected={selected}
            defaultMonth={selected ?? minDate}
            disabled={matchers.length > 0 ? matchers : undefined}
            onSelect={(date) => {
              onChange(date ? toISODate(date) : undefined);
              setOpen(false);
            }}
            autoFocus
          />
        </PopoverContent>
      </Popover>

      {clearable && selected && !disabled ? (
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="absolute right-1 top-1/2 size-7 -translate-y-1/2 text-muted-foreground"
          onClick={() => onChange(undefined)}
          aria-label="Clear date"
        >
          <X className="size-4" aria-hidden />
        </Button>
      ) : null}
    </div>
  );
}
