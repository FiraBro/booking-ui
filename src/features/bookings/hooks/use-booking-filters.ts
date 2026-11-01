"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback } from "react";
import {
  bookingFiltersSchema,
  type BookingFilters,
} from "@/lib/validations/auth";

export type FilterPatch = Record<string, string | number | undefined>;

/**
 * Keeps booking list filters in the URL (shareable, survives reloads and back/forward).
 * Pages that call this hook must be rendered inside a <Suspense> boundary.
 */
export function useBookingFilters() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const filters: BookingFilters = bookingFiltersSchema.parse(
    Object.fromEntries(searchParams.entries()),
  );

  /** Applies a patch to the query string. Changing any filter resets to page 1 unless `page` is in the patch. */
  const update = useCallback(
    (patch: FilterPatch) => {
      const next = new URLSearchParams(searchParams.toString());
      for (const [key, value] of Object.entries(patch)) {
        if (value === undefined || value === "" || value === "all")
          next.delete(key);
        else next.set(key, String(value));
      }
      if (!("page" in patch)) next.delete("page");
      const query = next.toString();
      router.replace(query ? `${pathname}?${query}` : pathname, {
        scroll: false,
      });
    },
    [pathname, router, searchParams],
  );

  /** Clears every filter except the keys listed in `keep` (e.g. a tab selector). */
  const reset = useCallback(
    (keep: string[] = []) => {
      const next = new URLSearchParams();
      for (const key of keep) {
        const value = searchParams.get(key);
        if (value) next.set(key, value);
      }
      const query = next.toString();
      router.replace(query ? `${pathname}?${query}` : pathname, {
        scroll: false,
      });
    },
    [pathname, router, searchParams],
  );

  return { filters, searchParams, update, reset };
}
