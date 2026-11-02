"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { LoaderCircle } from "lucide-react";
import { useMemo, type ReactNode } from "react";
import { Controller, useForm, type Control } from "react-hook-form";
import { FormField } from "@/components/shared/form-field";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { useUpdateSettings } from "@/features/settings/hooks/use-settings";
import { handleFormError } from "@/lib/api/form-errors";
import {
  settingsFormSchema,
  type SettingsFormValues,
} from "@/lib/validations/auth";
import type { Setting } from "@/types";

function toFormValues(settings: Setting): SettingsFormValues {
  return {
    businessName: settings.businessName,
    businessEmail: settings.businessEmail ?? "",
    businessPhone: settings.businessPhone ?? "",
    businessAddress: settings.businessAddress ?? "",
    timezone: settings.timezone,
    currency: settings.currency,
    slotIntervalMinutes: settings.slotIntervalMinutes,
    bookingLeadTimeHours: settings.bookingLeadTimeHours,
    cancellationWindowHours: settings.cancellationWindowHours,
    maxAdvanceBookingDays: settings.maxAdvanceBookingDays,
    autoConfirmBookings: settings.autoConfirmBookings,
    allowCustomerCancellation: settings.allowCustomerCancellation,
    emailNotificationsEnabled: settings.emailNotificationsEnabled,
    maintenanceMode: settings.maintenanceMode,
  };
}

function getTimeZones(current: string): string[] {
  const supported =
    typeof Intl.supportedValuesOf === "function"
      ? Intl.supportedValuesOf("timeZone")
      : [];
  return Array.from(new Set<string>(["UTC", ...supported, current])).sort();
}

type SwitchName =
  | "autoConfirmBookings"
  | "allowCustomerCancellation"
  | "emailNotificationsEnabled"
  | "maintenanceMode";

function SwitchRow({
  control,
  name,
  title,
  description,
}: {
  control: Control<SettingsFormValues>;
  name: SwitchName;
  title: string;
  description: string;
}) {
  return (
    <Controller
      control={control}
      name={name}
      render={({ field }) => (
        <div className="flex items-center justify-between gap-4 rounded-lg border p-3">
          <div>
            <p className="text-sm font-medium">{title}</p>
            <p className="text-xs text-muted-foreground">{description}</p>
          </div>
          <Switch
            checked={field.value}
            onCheckedChange={field.onChange}
            aria-label={title}
          />
        </div>
      )}
    />
  );
}

function Section({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">{children}</CardContent>
    </Card>
  );
}

export function SettingsForm({ settings }: { settings: Setting }) {
  const update = useUpdateSettings();
  const zones = useMemo(
    () => getTimeZones(settings.timezone),
    [settings.timezone],
  );
  const {
    register,
    control,
    handleSubmit,
    setError,
    reset,
    formState: { errors, isDirty },
  } = useForm<SettingsFormValues>({
    resolver: zodResolver(settingsFormSchema),
    defaultValues: toFormValues(settings),
  });

  const onSubmit = handleSubmit((values) => {
    update.mutate(values, {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      onSuccess: (saved: any) => reset(toFormValues(saved)),

      onError: (error) => handleFormError(error, setError),
    });
  });

  return (
    <form onSubmit={onSubmit} noValidate className="max-w-3xl space-y-6">
      <Section
        title="Business"
        description="Shown on invoices, emails and the public site."
      >
        <FormField
          label="Business name"
          error={errors.businessName?.message}
          required
        >
          {(field) => <Input {...field} {...register("businessName")} />}
        </FormField>
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField
            label="Contact email"
            error={errors.businessEmail?.message}
          >
            {(field) => (
              <Input type="email" {...field} {...register("businessEmail")} />
            )}
          </FormField>
          <FormField
            label="Contact phone"
            error={errors.businessPhone?.message}
          >
            {(field) => (
              <Input type="tel" {...field} {...register("businessPhone")} />
            )}
          </FormField>
        </div>
        <FormField label="Address" error={errors.businessAddress?.message}>
          {(field) => (
            <Textarea rows={2} {...field} {...register("businessAddress")} />
          )}
        </FormField>
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField
            label="Time zone"
            error={errors.timezone?.message}
            required
          >
            {(field) => (
              <Controller
                control={control}
                name="timezone"
                render={({ field: controller }) => (
                  <Select
                    value={controller.value}
                    onValueChange={controller.onChange}
                  >
                    <SelectTrigger id={field.id} className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {zones.map((zone) => (
                        <SelectItem key={zone} value={zone}>
                          {zone}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            )}
          </FormField>
          <FormField
            label="Currency"
            error={errors.currency?.message}
            description="3-letter code, e.g. USD"
            required
          >
            {(field) => (
              <Input
                maxLength={3}
                className="uppercase"
                {...field}
                {...register("currency")}
              />
            )}
          </FormField>
        </div>
      </Section>

      <Section
        title="Booking rules"
        description="Control how far ahead and how often customers can book."
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField
            label="Slot interval (minutes)"
            error={errors.slotIntervalMinutes?.message}
            required
          >
            {(field) => (
              <Input
                type="number"
                min={5}
                step={5}
                {...field}
                {...register("slotIntervalMinutes")}
              />
            )}
          </FormField>
          <FormField
            label="Minimum notice (hours)"
            error={errors.bookingLeadTimeHours?.message}
            required
          >
            {(field) => (
              <Input
                type="number"
                min={0}
                {...field}
                {...register("bookingLeadTimeHours")}
              />
            )}
          </FormField>
          <FormField
            label="Cancellation window (hours)"
            error={errors.cancellationWindowHours?.message}
            required
          >
            {(field) => (
              <Input
                type="number"
                min={0}
                {...field}
                {...register("cancellationWindowHours")}
              />
            )}
          </FormField>
          <FormField
            label="Book up to (days ahead)"
            error={errors.maxAdvanceBookingDays?.message}
            required
          >
            {(field) => (
              <Input
                type="number"
                min={1}
                {...field}
                {...register("maxAdvanceBookingDays")}
              />
            )}
          </FormField>
        </div>
        <SwitchRow
          control={control}
          name="autoConfirmBookings"
          title="Auto-confirm bookings"
          description="New bookings skip the pending state."
        />
        <SwitchRow
          control={control}
          name="allowCustomerCancellation"
          title="Allow customer cancellation"
          description="Customers can cancel inside the cancellation window."
        />
      </Section>

      <Section
        title="System"
        description="Notifications and availability of the booking site."
      >
        <SwitchRow
          control={control}
          name="emailNotificationsEnabled"
          title="Email notifications"
          description="Send booking and payment emails."
        />
        <SwitchRow
          control={control}
          name="maintenanceMode"
          title="Maintenance mode"
          description="Customers see a maintenance message and can't book."
        />
      </Section>

      <div className="sticky bottom-4 flex justify-end">
        <Button
          type="submit"
          size="lg"
          disabled={!isDirty || update.isPending}
          className="shadow-md"
        >
          {update.isPending ? (
            <LoaderCircle className="animate-spin" aria-hidden />
          ) : null}
          Save settings
        </Button>
      </div>
    </form>
  );
}
