"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { LoaderCircle } from "lucide-react";
import { Controller, useForm, useWatch } from "react-hook-form";
import { ErrorState } from "@/components/shared/error-state";
import { FormSkeleton } from "@/components/shared/loading-skeleton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { useStaffSchedule } from "@/features/staff/hooks/use-staff";
import { useSaveStaffSchedule } from "@/features/staff/hooks/use-staff-mutations";
import { handleFormError } from "@/lib/api/form-errors";
import { DAYS_OF_WEEK } from "@/lib/constants";
import { cn } from "@/lib/utils";
import {
  scheduleFormSchema,
  type ScheduleFormValues,
} from "@/lib/validations/auth";
import type { Schedule } from "@/types";

/** Monday first. Values match Date#getDay (0 = Sunday). */
const DISPLAY_ORDER = [1, 2, 3, 4, 5, 6, 0] as const;

function buildDefaults(schedule: Schedule): ScheduleFormValues {
  return {
    workingHours: DISPLAY_ORDER.map((dayOfWeek) => {
      const rows = schedule.workingHours.filter(
        (row) => row.dayOfWeek === dayOfWeek,
      );
      const row = rows.find((candidate) => candidate.isWorking) ?? rows[0];
      return {
        dayOfWeek,
        isWorking: row?.isWorking ?? false,
        startTime: row?.startTime ?? "09:00",
        endTime: row?.endTime ?? "17:00",
      };
    }),
  };
}

function ScheduleForm({
  staffId,
  schedule,
}: {
  staffId: string;
  schedule: Schedule;
}) {
  const save = useSaveStaffSchedule();
  const defaults = buildDefaults(schedule);
  const {
    register,
    control,
    handleSubmit,
    setError,
    reset,
    formState: { errors, isDirty },
  } = useForm<ScheduleFormValues>({
    resolver: zodResolver(scheduleFormSchema),
    defaultValues: defaults,
  });
  const rows = useWatch({ control, name: "workingHours" });

  const onSubmit = handleSubmit((values) => {
    save.mutate(
      { id: staffId, values },
      {
        onSuccess: () => reset(values),
        onError: (error) => handleFormError(error, setError),
      },
    );
  });

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-4">
      <ul className="divide-y rounded-lg border">
        {defaults.workingHours.map((row, index) => {
          const working = rows?.[index]?.isWorking ?? row.isWorking;
          const label = DAYS_OF_WEEK[row.dayOfWeek]?.label ?? "Day";
          const endError = errors.workingHours?.[index]?.endTime?.message;
          const startError = errors.workingHours?.[index]?.startTime?.message;

          return (
            <li
              key={row.dayOfWeek}
              className="grid items-center gap-3 p-3 sm:grid-cols-[10rem_1fr_1fr]"
            >
              <div className="flex items-center gap-3">
                <input
                  type="hidden"
                  {...register(`workingHours.${index}.dayOfWeek`, {
                    valueAsNumber: true,
                  })}
                />
                <Controller
                  control={control}
                  name={`workingHours.${index}.isWorking`}
                  render={({ field }) => (
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                      aria-label={`${label} is a working day`}
                    />
                  )}
                />
                <span
                  className={cn(
                    "text-sm font-medium",
                    !working && "text-muted-foreground",
                  )}
                >
                  {label}
                </span>
              </div>

              <div className="space-y-1">
                <Input
                  type="time"
                  aria-label={`${label} start time`}
                  aria-invalid={startError ? true : undefined}
                  readOnly={!working}
                  tabIndex={working ? 0 : -1}
                  className={cn(!working && "opacity-50")}
                  {...register(`workingHours.${index}.startTime`)}
                />
                {startError ? (
                  <p className="text-xs text-destructive">{startError}</p>
                ) : null}
              </div>

              <div className="space-y-1">
                <Input
                  type="time"
                  aria-label={`${label} end time`}
                  aria-invalid={endError ? true : undefined}
                  readOnly={!working}
                  tabIndex={working ? 0 : -1}
                  className={cn(!working && "opacity-50")}
                  {...register(`workingHours.${index}.endTime`)}
                />
                {endError ? (
                  <p role="alert" className="text-xs text-destructive">
                    {endError}
                  </p>
                ) : null}
              </div>
            </li>
          );
        })}
      </ul>

      {errors.workingHours?.root?.message ? (
        <p role="alert" className="text-sm text-destructive">
          {errors.workingHours.root.message}
        </p>
      ) : null}

      <Button type="submit" disabled={!isDirty || save.isPending}>
        {save.isPending ? (
          <LoaderCircle className="animate-spin" aria-hidden />
        ) : null}
        Save working hours
      </Button>
    </form>
  );
}

export function ScheduleEditor({ staffId }: { staffId: string }) {
  const query = useStaffSchedule(staffId);
  if (query.isPending) return <FormSkeleton fields={5} />;
  if (query.isError || !query.data) {
    return (
      <ErrorState error={query.error} onRetry={() => void query.refetch()} />
    );
  }
  return <ScheduleForm staffId={staffId} schedule={query.data} />;
}
