"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type PageItem = number | "ellipsis-start" | "ellipsis-end";

export function getPageItems(
  page: number,
  totalPages: number,
  siblings = 1,
): PageItem[] {
  if (totalPages <= 5 + siblings * 2) {
    return Array.from({ length: totalPages }, (_, index) => index + 1);
  }
  const start = Math.max(2, page - siblings);
  const end = Math.min(totalPages - 1, page + siblings);
  const items: PageItem[] = [1];
  if (start > 2) items.push("ellipsis-start");
  for (let value = start; value <= end; value += 1) items.push(value);
  if (end < totalPages - 1) items.push("ellipsis-end");
  items.push(totalPages);
  return items;
}

interface PaginationProps {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  disabled?: boolean;
  className?: string;
}

export function Pagination({
  page,
  totalPages,
  onPageChange,
  disabled,
  className,
}: PaginationProps) {
  if (totalPages <= 1) return null;

  const current = Math.min(Math.max(page, 1), totalPages);
  const items = getPageItems(current, totalPages);

  return (
    <nav
      aria-label="Pagination"
      className={cn("flex items-center gap-1", className)}
    >
      <Button
        variant="outline"
        size="icon"
        className="size-8"
        onClick={() => onPageChange(current - 1)}
        disabled={disabled || current <= 1}
        aria-label="Previous page"
      >
        <ChevronLeft aria-hidden />
      </Button>

      <span
        className="px-2 text-sm text-muted-foreground sm:hidden"
        aria-live="polite"
      >
        Page {current} of {totalPages}
      </span>

      <ul className="hidden items-center gap-1 sm:flex">
        {items.map((item) =>
          typeof item === "number" ? (
            <li key={item}>
              <Button
                variant={item === current ? "default" : "ghost"}
                size="icon"
                className="size-8 text-sm"
                onClick={() => onPageChange(item)}
                disabled={disabled}
                aria-label={`Page ${item}`}
                aria-current={item === current ? "page" : undefined}
              >
                {item}
              </Button>
            </li>
          ) : (
            <li
              key={item}
              aria-hidden
              className="px-1 text-sm text-muted-foreground"
            >
              …
            </li>
          ),
        )}
      </ul>

      <Button
        variant="outline"
        size="icon"
        className="size-8"
        onClick={() => onPageChange(current + 1)}
        disabled={disabled || current >= totalPages}
        aria-label="Next page"
      >
        <ChevronRight aria-hidden />
      </Button>
    </nav>
  );
}
