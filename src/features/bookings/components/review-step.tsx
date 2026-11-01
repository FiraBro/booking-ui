"use client";

import { CircleAlert } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { ResolvedSlot } from "@/features/bookings/lib/slots";
import {
  formatCurrency,
  formatDuration,
  formatLongDate,
  formatTimeRange,
} from "@/lib/format";
import type { Service } from "@/types";

interface ReviewStepProps {
  service: Service;
  slot: ResolvedSlot;
  staffLabel: string;
  notes: string;
  onNotesChange: (notes: string) => void;
  error?: string | null;
}

const NOTES_LIMIT = 500;

export function ReviewStep({
  service,
  slot,
  staffLabel,
  notes,
  onNotesChange,
  error,
}: ReviewStepProps) {
  const rows: Array<[string, string]> = [
    ["Service", service.name],
    ["Date", formatLongDate(slot.start)],
    ["Time", formatTimeRange(slot.start, slot.end)],
    ["Duration", formatDuration(service.durationMinutes)],
    ["Staff", staffLabel],
  ];

  return (
    <div className="space-y-5">
      {error ? (
        <Alert variant="destructive">
          <CircleAlert aria-hidden />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}

      <dl className="divide-y rounded-lg border">
        {rows.map(([label, value]) => (
          <div
            key={label}
            className="flex items-start justify-between gap-4 px-4 py-3 text-sm"
          >
            <dt className="text-muted-foreground">{label}</dt>
            <dd className="text-right font-medium">{value}</dd>
          </div>
        ))}
        <div className="flex items-center justify-between gap-4 bg-muted/40 px-4 py-3">
          <dt className="text-sm font-medium">Total</dt>
          <dd className="tabular text-lg font-semibold">
            {formatCurrency(service.price, service.currency)}
          </dd>
        </div>
      </dl>

      <div className="space-y-2">
        <Label htmlFor="booking-notes">Notes for the provider (optional)</Label>
        <Textarea
          id="booking-notes"
          value={notes}
          onChange={(event) => onNotesChange(event.target.value)}
          maxLength={NOTES_LIMIT}
          rows={3}
          placeholder="Anything we should know before your appointment?"
          aria-describedby="booking-notes-count"
        />
        <p
          id="booking-notes-count"
          className="text-right text-xs text-muted-foreground"
        >
          {notes.length}/{NOTES_LIMIT}
        </p>
      </div>

      <p className="text-xs text-muted-foreground">
        Your booking is created first. You can pay and manage it from the
        booking page.
      </p>
    </div>
  );
}
