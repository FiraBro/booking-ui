import { combineDateAndTime, fromISODate, toDate } from "@/lib/format";
import type { AvailabilitySlot } from "@/types";

const TIME_ONLY = /^\d{1,2}:\d{2}(:\d{2})?$/;

export interface SlotStaff {
  id: string;
  name: string | null;
}

/** One selectable start time. Several raw slots (one per staff member) collapse into one. */
export interface ResolvedSlot {
  /** ISO 8601 start (UTC). This exact value is sent to POST /bookings as `start_time`. */
  key: string;
  start: Date;
  end: Date | null;
  isAvailable: boolean;
  isPast: boolean;
  reason: string | null;
  /** Staff members who are free at this time (empty when the backend sends no staff info). */
  staff: SlotStaff[];
}

export type DayPart = "morning" | "afternoon" | "evening";

export const DAY_PART_LABELS: Record<DayPart, string> = {
  morning: "Morning",
  afternoon: "Afternoon",
  evening: "Evening",
};

/** Accepts ISO datetimes ("2026-11-02T09:00:00Z") and bare times ("09:00") for the given calendar date. */
function resolveTime(
  date: string,
  value: string | null | undefined,
): Date | null {
  if (!value) return null;
  if (TIME_ONLY.test(value)) {
    const base = fromISODate(date);
    return base
      ? combineDateAndTime(base, value.slice(0, 5).padStart(5, "0"))
      : null;
  }
  return toDate(value);
}

export function resolveSlots(
  date: string,
  slots: readonly AvailabilitySlot[] | undefined,
  now: Date = new Date(),
): ResolvedSlot[] {
  const byKey = new Map<string, ResolvedSlot>();

  for (const slot of slots ?? []) {
    const start = resolveTime(date, slot.startTime);
    if (!start) continue;

    const key = start.toISOString();
    const isPast = start.getTime() <= now.getTime();
    const usable = slot.isAvailable && !isPast;

    const entry: ResolvedSlot = byKey.get(key) ?? {
      key,
      start,
      end: resolveTime(date, slot.endTime),
      isAvailable: false,
      isPast,
      reason: null,
      staff: [],
    };

    if (usable) {
      entry.isAvailable = true;
      const staffId = slot.staffId;
      if (staffId && !entry.staff.some((member) => member.id === staffId)) {
        entry.staff.push({ id: staffId, name: slot.staffName ?? null });
      }
    } else if (!entry.reason) {
      entry.reason = isPast
        ? "This time has already passed"
        : (slot.reason ?? "Unavailable");
    }

    byKey.set(key, entry);
  }

  return Array.from(byKey.values()).sort(
    (a, b) => a.start.getTime() - b.start.getTime(),
  );
}

export function groupByDayPart(
  slots: readonly ResolvedSlot[],
): Record<DayPart, ResolvedSlot[]> {
  const groups: Record<DayPart, ResolvedSlot[]> = {
    morning: [],
    afternoon: [],
    evening: [],
  };
  for (const slot of slots) {
    const hour = slot.start.getHours();
    const part: DayPart =
      hour < 12 ? "morning" : hour < 17 ? "afternoon" : "evening";
    groups[part].push(slot);
  }
  return groups;
}
