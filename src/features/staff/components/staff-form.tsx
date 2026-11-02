"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { LoaderCircle } from "lucide-react";
import { Controller, useForm } from "react-hook-form";
import { FormField } from "@/components/shared/form-field";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  useCreateStaff,
  useUpdateStaff,
} from "@/features/staff/hooks/use-staff-mutations";
import { handleFormError } from "@/lib/api/form-errors";
import { staffFormSchema, type StaffFormValues } from "@/lib/validations/auth";
import type { Staff } from "@/types";

interface StaffFormProps {
  member?: Staff;
  onSaved?: (member: Staff) => void;
  onCancel?: () => void;
}

export function StaffForm({ member, onSaved, onCancel }: StaffFormProps) {
  const create = useCreateStaff();
  const update = useUpdateStaff();
  const pending = create.isPending || update.isPending;

  const {
    register,
    control,
    handleSubmit,
    setError,
    reset,
    formState: { errors, isDirty },
  } = useForm<StaffFormValues>({
    resolver: zodResolver(staffFormSchema),
    defaultValues: {
      userId: member?.userId ?? "",
      firstName: member?.firstName ?? "",
      lastName: member?.lastName ?? "",
      email: member?.email ?? "",
      phone: member?.phone ?? "",
      title: member?.title ?? "",
      bio: member?.bio ?? "",
      isActive: member?.isActive ?? true,
    },
  });

  const onSubmit = handleSubmit((values) => {
    const onError = (error: unknown) => handleFormError(error, setError);
    if (member) {
      update.mutate(
        { id: member.id, values: { ...values, userId: undefined } },
        {
          onError,
          onSuccess: (saved) => {
            reset(values);
            onSaved?.(saved);
          },
        },
      );
    } else {
      create.mutate(values, {
        onError,
        onSuccess: (saved) => onSaved?.(saved),
      });
    }
  });

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <FormField
          label="First name"
          error={errors.firstName?.message}
          required
        >
          {(field) => <Input {...field} {...register("firstName")} />}
        </FormField>
        <FormField label="Last name" error={errors.lastName?.message} required>
          {(field) => <Input {...field} {...register("lastName")} />}
        </FormField>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <FormField label="Email" error={errors.email?.message} required>
          {(field) => <Input type="email" {...field} {...register("email")} />}
        </FormField>
        <FormField label="Phone" error={errors.phone?.message}>
          {(field) => <Input type="tel" {...field} {...register("phone")} />}
        </FormField>
      </div>

      <FormField label="Job title" error={errors.title?.message}>
        {(field) => (
          <Input
            maxLength={100}
            placeholder="e.g. Senior stylist"
            {...field}
            {...register("title")}
          />
        )}
      </FormField>

      <FormField label="Bio" error={errors.bio?.message}>
        {(field) => (
          <Textarea rows={3} maxLength={1000} {...field} {...register("bio")} />
        )}
      </FormField>

      {!member ? (
        <FormField
          label="User account ID"
          error={errors.userId?.message}
          description="Optional. Link this profile to an existing user so they can sign in to the staff area."
        >
          {(field) => <Input {...field} {...register("userId")} />}
        </FormField>
      ) : null}

      <Controller
        control={control}
        name="isActive"
        render={({ field }) => (
          <div className="flex items-center justify-between rounded-lg border p-3">
            <div>
              <p className="text-sm font-medium">Active</p>
              <p className="text-xs text-muted-foreground">
                Inactive staff can&apos;t be booked.
              </p>
            </div>
            <Switch
              checked={field.value}
              onCheckedChange={field.onChange}
              aria-label="Active"
            />
          </div>
        )}
      />

      <div className="flex justify-end gap-2">
        {onCancel ? (
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={pending}
          >
            Cancel
          </Button>
        ) : null}
        <Button
          type="submit"
          disabled={pending || (Boolean(member) && !isDirty)}
        >
          {pending ? (
            <LoaderCircle className="animate-spin" aria-hidden />
          ) : null}
          {member ? "Save changes" : "Create staff member"}
        </Button>
      </div>
    </form>
  );
}

/** Rendered only while open, so the form state is fresh every time. */
export function StaffFormDialog({ onClose }: { onClose: () => void }) {
  return (
    <Dialog open onOpenChange={(open) => (open ? undefined : onClose())}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>New staff member</DialogTitle>
          <DialogDescription>
            After creating the profile, assign services and set working hours.
          </DialogDescription>
        </DialogHeader>
        <StaffForm onSaved={onClose} onCancel={onClose} />
      </DialogContent>
    </Dialog>
  );
}
