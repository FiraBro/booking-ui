"use client";

import { Search, X } from "lucide-react";
import { useEffect, useRef, useState, type ChangeEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SEARCH_DEBOUNCE_MS } from "@/lib/constants";
import { cn } from "@/lib/utils";

interface SearchInputProps {
  /** The committed (debounced) search term held by the parent, e.g. from the URL. */
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  debounceMs?: number;
  "aria-label"?: string;
  className?: string;
}

export function SearchInput({
  value,
  onChange,
  placeholder = "Search…",
  debounceMs = SEARCH_DEBOUNCE_MS,
  "aria-label": ariaLabel = "Search",
  className,
}: SearchInputProps) {
  const [local, setLocal] = useState(value);
  const [previousValue, setPreviousValue] = useState(value);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Adopt external changes (filters reset, URL navigation) without an effect.
  if (value !== previousValue) {
    setPreviousValue(value);
    setLocal(value);
  }

  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );

  function cancelPending() {
    if (timer.current) {
      clearTimeout(timer.current);
      timer.current = null;
    }
  }

  function handleChange(event: ChangeEvent<HTMLInputElement>) {
    const next = event.target.value;
    setLocal(next);
    cancelPending();
    timer.current = setTimeout(() => {
      timer.current = null;
      onChange(next.trim());
    }, debounceMs);
  }

  function handleClear() {
    cancelPending();
    setLocal("");
    onChange("");
  }

  return (
    <div className={cn("relative w-full sm:max-w-xs", className)}>
      <Search
        className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
        aria-hidden
      />
      <Input
        type="search"
        value={local}
        onChange={handleChange}
        placeholder={placeholder}
        aria-label={ariaLabel}
        autoComplete="off"
        className="pl-8 pr-8 [&::-webkit-search-cancel-button]:appearance-none"
      />
      {local ? (
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="absolute right-1 top-1/2 size-7 -translate-y-1/2 text-muted-foreground"
          onClick={handleClear}
          aria-label="Clear search"
        >
          <X className="size-4" aria-hidden />
        </Button>
      ) : null}
    </div>
  );
}
