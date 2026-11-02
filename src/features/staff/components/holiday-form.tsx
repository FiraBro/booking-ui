"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { LoaderCircle } from "lucide-react";
import { Controller, useForm } from "react-hook-form";
import { DatePicker } from "@/components/shared/date-picker";
import { FormField } from "@/components/shared/form-field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useStaffSchedule } from "@/features/staff/hooks/use-staff";
import { useAddStaffHoliday } from "@/features/staff/hooks/use-staff-mutations";
import { handleFormError } from "@/lib/api/form-errors";
import { formatDate, toISODate } from "@/lib/format";
import {
  holidayFormSchema,
  type HolidayFormValues,
} from "@/lib/validations/auth";

export function HolidayForm({ staffId }: { staffId: string }) {
  const schedule = useStaffSchedule(staffId);
  const add = useAddStaffHoliday();
  const today = toISODate(new Date());

  const {
    register,
    control,
    handleSubmit,
    setError,
    setValue,
    getValues,
    reset,
    formState: { errors },
  } = useForm<HolidayFormValues>({
    resolver: zodResolver(holidayFormSchema),
    defaultValues: { startDate: today, endDate: today, reason: "" },
  });

  const onSubmit = handleSubmit((values) => {
    add.mutate(
      { id: staffId, values },
      {
        onSuccess: () =>
          reset({ startDate: today, endDate: today, reason: "" }),
        onError: (error) => handleFormError(error, setError),
      },
    );
  });

  const holidays = schedule.data?.holidays ?? [];

  return (
    <div className="space-y-6">
      <form onSubmit={onSubmit} noValidate className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField label="From" error={errors.startDate?.message} required>
            {(field) => (
              <Controller
                control={control}
                name="startDate"
                render={({ field: controller }) => (
                  <DatePicker
                    id={field.id}
                    value={controller.value}
                    minDate={new Date()}
                    onChange={(value) => {
                      controller.onChange(value ?? "");
                      if (value && value > getValues("endDate"))
                        setValue("endDate", value);
                    }}
                    aria-invalid={field["aria-invalid"]}
                    aria-describedby={field["aria-describedby"]}
                  />
                )}
              />
            )}
          </FormField>
          <FormField label="To" error={errors.endDate?.message} required>
            {(field) => (
              <Controller
                control={control}
                name="endDate"
                render={({ field: controller }) => (
                  <DatePicker
                    id={field.id}
                    value={controller.value}
                    minDate={new Date()}
                    onChange={(value) => controller.onChange(value ?? "")}
                    aria-invalid={field["aria-invalid"]}
                    aria-describedby={field["aria-describedby"]}
                  />
                )}
              />
            )}
          </FormField>
        </div>

        <FormField
          label="Reason"
          error={errors.reason?.message}
          description="Optional, e.g. Annual leave."
        >
          {(field) => (
            <Input maxLength={200} {...field} {...register("reason")} />
          )}
        </FormField>

        <Button type="submit" disabled={add.isPending}>
          {add.isPending ? (
            <LoaderCircle className="animate-spin" aria-hidden />
          ) : null}
          Add time off
        </Button>
      </form>

      <section aria-labelledby="holidays-heading" className="space-y-2">
        <h3 id="holidays-heading" className="text-sm font-medium">
          Scheduled time off
        </h3>
        {holidays.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No time off scheduled.
          </p>
        ) : (
          <ul className="divide-y rounded-lg border">
            {holidays.map((holiday, index) => (
              <li
                key={holiday.id ?? `${holiday.startDate}-${index}`}
                className="flex flex-wrap items-center justify-between gap-2 p-3 text-sm"
              >
                <span className="font-medium">
                  {formatDate(holiday.startDate)}
                  {holiday.endDate.slice(0, 10) !==
                  holiday.startDate.slice(0, 10)
                    ? ` – ${formatDate(holiday.endDate)}`
                    : ""}
                </span>
                <span className="text-muted-foreground">
                  {holiday.reason ?? "Time off"}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
