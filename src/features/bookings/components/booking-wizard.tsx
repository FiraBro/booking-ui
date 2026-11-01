"use client";

import { useQueryClient } from "@tanstack/react-query";
import { Check, LoaderCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ErrorState } from "@/components/shared/error-state";
import { notify } from "@/components/shared/toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ROUTES } from "@/config/routes";
import { DateStep } from "@/features/bookings/components/date-step";
import { ReviewStep } from "@/features/bookings/components/review-step";
import { ServiceStep } from "@/features/bookings/components/service-step";
import { StaffStep } from "@/features/bookings/components/staff-step";
import { useCreateBooking } from "@/features/bookings/hooks/use-booking-mutations";
import type { ResolvedSlot } from "@/features/bookings/lib/slots";
import { useService } from "@/features/services/hooks/use-service";
import { getFieldErrors, normalizeApiError } from "@/lib/api/error";
import { queryKeys } from "@/lib/constants";
import {
  formatCurrency,
  formatDuration,
  formatLongDate,
  formatTimeRange,
} from "@/lib/format";
import { cn } from "@/lib/utils";
import { createBookingSchema } from "@/lib/validations/auth";
import type { Service } from "@/types";

type StepKey = "service" | "time" | "staff" | "review";

const STEP_LABELS: Record<StepKey, string> = {
  service: "Service",
  time: "Date & time",
  staff: "Staff",
  review: "Review",
};

const STEP_HEADINGS: Record<StepKey, string> = {
  service: "Choose a service",
  time: "Pick a date and time",
  staff: "Choose who you'd like to see",
  review: "Review and confirm",
};

interface BookingWizardProps {
  /** Preselects a service (e.g. from the public service page) and starts at the date step. */
  initialServiceId?: string;
}

export function BookingWizard({ initialServiceId }: BookingWizardProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const createBooking = useCreateBooking();

  const [serviceId, setServiceId] = useState<string | undefined>(
    initialServiceId,
  );
  const [date, setDate] = useState<string | undefined>();
  const [slot, setSlot] = useState<ResolvedSlot | null>(null);
  const [staffChoice, setStaffChoice] = useState("any");
  const [staffName, setStaffName] = useState<string | null>(null);
  const [notes, setNotes] = useState("");
  const [step, setStep] = useState<StepKey>(
    initialServiceId ? "time" : "service",
  );
  const [submitError, setSubmitError] = useState<string | null>(null);

  const serviceQuery = useService(serviceId);
  const service = serviceQuery.data;

  const showStaffStep = (slot?.staff.length ?? 0) > 1;
  const steps: StepKey[] = [
    "service",
    "time",
    ...(showStaffStep ? (["staff"] as const) : []),
    "review",
  ];
  const index = Math.max(steps.indexOf(step), 0);

  const staffLabel =
    staffChoice === "any"
      ? slot && slot.staff.length === 1
        ? (slot.staff[0]?.name ?? "Assigned automatically")
        : "Any available"
      : (staffName ?? "Selected staff member");

  const canContinue =
    step === "service"
      ? Boolean(serviceId)
      : step === "time"
        ? Boolean(slot)
        : true;

  /* ------------------------------ handlers ------------------------------ */

  function resetSelection() {
    setDate(undefined);
    setSlot(null);
    setStaffChoice("any");
    setStaffName(null);
    setSubmitError(null);
  }

  function handleSelectService(selected: Service) {
    queryClient.setQueryData(queryKeys.services.detail(selected.id), selected);
    if (selected.id !== serviceId) {
      setServiceId(selected.id);
      resetSelection();
    }
  }

  function handleDateChange(next: string) {
    if (next === date) return;
    setDate(next);
    setSlot(null);
    setStaffChoice("any");
    setStaffName(null);
  }

  function handleSlotChange(next: ResolvedSlot) {
    setSlot(next);
    setStaffChoice("any");
    setStaffName(null);
    setSubmitError(null);
  }

  function handleStaffChange(value: string, name: string | null) {
    setStaffChoice(value);
    setStaffName(name);
  }

  function goNext() {
    const next = steps[index + 1];
    if (next) setStep(next);
  }

  function goBack() {
    const previous = steps[index - 1];
    if (previous) {
      setSubmitError(null);
      setStep(previous);
    }
  }

  function handleConfirm() {
    if (!serviceId || !slot) return;

    const parsed = createBookingSchema.safeParse({
      serviceId,
      staffId: staffChoice !== "any" ? staffChoice : undefined,
      startTime: slot.key,
      notes: notes.trim() || undefined,
    });
    if (!parsed.success) {
      setSubmitError(
        parsed.error.issues[0]?.message ?? "Please check your booking details.",
      );
      return;
    }

    setSubmitError(null);
    createBooking.mutate(parsed.data, {
      onSuccess: (booking) => {
        notify.success(
          "Booking requested",
          "You can review it and pay from the booking page.",
        );
        router.push(ROUTES.customer.bookingDetail(booking.id));
      },
      onError: (error) => {
        const normalized = normalizeApiError(error);

        if (normalized.kind === "conflict") {
          setSlot(null);
          setStep("time");
          void queryClient.invalidateQueries({
            queryKey: queryKeys.availability.all,
          });
          notify.warning(
            "That time is no longer available",
            "Please choose another slot.",
          );
          return;
        }
        if (normalized.kind === "validation" && normalized.hasFieldErrors) {
          setSubmitError(
            Object.values(getFieldErrors(error))[0] ?? normalized.message,
          );
          return;
        }
        setSubmitError(normalized.message);
      },
    });
  }

  /* -------------------------------- views -------------------------------- */

  const serviceFailed = Boolean(serviceId) && serviceQuery.isError && !service;

  function renderStep() {
    if (step === "service") {
      return (
        <ServiceStep selectedId={serviceId} onSelect={handleSelectService} />
      );
    }

    if (serviceFailed) {
      return (
        <ErrorState
          error={serviceQuery.error}
          onRetry={() => void serviceQuery.refetch()}
          action={
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setServiceId(undefined);
                resetSelection();
                setStep("service");
              }}
            >
              Choose another service
            </Button>
          }
        />
      );
    }

    if (!serviceId) return null;

    if (step === "time") {
      return (
        <DateStep
          serviceId={serviceId}
          date={date}
          onDateChange={handleDateChange}
          slotKey={slot?.key ?? null}
          onSlotChange={handleSlotChange}
        />
      );
    }

    if (step === "staff" && slot) {
      return (
        <StaffStep
          options={slot.staff}
          value={staffChoice}
          onChange={handleStaffChange}
        />
      );
    }

    if (step === "review" && slot && service) {
      return (
        <ReviewStep
          service={service}
          slot={slot}
          staffLabel={staffLabel}
          notes={notes}
          onNotesChange={setNotes}
          error={submitError}
        />
      );
    }

    return <Skeleton className="h-40 w-full" />;
  }

  return (
    <div className="space-y-6">
      <ol
        aria-label="Booking progress"
        className="flex flex-wrap items-center gap-2 text-sm"
      >
        {steps.map((key, position) => {
          const state =
            position < index ? "done" : position === index ? "current" : "todo";
          return (
            <li
              key={key}
              className="flex items-center gap-2"
              aria-current={state === "current" ? "step" : undefined}
            >
              <span
                className={cn(
                  "flex size-6 items-center justify-center rounded-full text-xs font-semibold",
                  state === "todo"
                    ? "bg-muted text-muted-foreground"
                    : "bg-primary text-primary-foreground",
                )}
              >
                {state === "done" ? (
                  <Check className="size-3.5" aria-hidden />
                ) : (
                  position + 1
                )}
              </span>
              <span
                className={cn(
                  state === "current" ? "font-medium" : "text-muted-foreground",
                )}
              >
                {STEP_LABELS[key]}
              </span>
              {position < steps.length - 1 ? (
                <span aria-hidden className="mx-1 h-px w-6 bg-border" />
              ) : null}
            </li>
          );
        })}
      </ol>

      <div className="grid gap-6 lg:grid-cols-[1fr_20rem]">
        <Card>
          <CardContent className="space-y-6">
            <h2 className="text-lg font-semibold">{STEP_HEADINGS[step]}</h2>
            {renderStep()}

            <div className="flex items-center justify-between gap-2 border-t pt-4">
              <Button
                variant="outline"
                onClick={goBack}
                disabled={index <= 0 || createBooking.isPending}
              >
                Back
              </Button>
              {step === "review" ? (
                <Button
                  onClick={handleConfirm}
                  disabled={createBooking.isPending || !service || !slot}
                >
                  {createBooking.isPending ? (
                    <LoaderCircle className="animate-spin" aria-hidden />
                  ) : null}
                  {createBooking.isPending ? "Confirming…" : "Confirm booking"}
                </Button>
              ) : (
                <Button onClick={goNext} disabled={!canContinue}>
                  Continue
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        <aside
          aria-label="Booking summary"
          className="lg:sticky lg:top-24 lg:self-start"
        >
          <Card>
            <CardContent className="space-y-3 text-sm">
              <h2 className="text-base font-semibold">Your booking</h2>
              {!serviceId ? (
                <p className="text-muted-foreground">
                  Choose a service to get started.
                </p>
              ) : serviceQuery.isPending ? (
                <div className="space-y-2">
                  <Skeleton className="h-5 w-40" />
                  <Skeleton className="h-4 w-28" />
                </div>
              ) : service ? (
                <div>
                  <p className="font-medium">{service.name}</p>
                  <p className="text-muted-foreground">
                    {formatDuration(service.durationMinutes)} ·{" "}
                    {formatCurrency(service.price, service.currency)}
                  </p>
                </div>
              ) : null}

              {slot ? (
                <div className="border-t pt-3">
                  <p className="font-medium">{formatLongDate(slot.start)}</p>
                  <p className="text-muted-foreground">
                    {formatTimeRange(slot.start, slot.end)}
                  </p>
                  <p className="text-muted-foreground">{staffLabel}</p>
                </div>
              ) : null}
            </CardContent>
          </Card>
        </aside>
      </div>
    </div>
  );
}
