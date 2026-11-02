"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { LoaderCircle } from "lucide-react";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
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
import {
  useUpdateUser,
  useUpdateUserRole,
} from "@/features/users/hooks/use-user-mutations";
import { handleFormError } from "@/lib/api/form-errors";
import {
  USER_ROLES,
  USER_ROLE_LABELS,
  parseUserRole,
  type UserRole,
} from "@/lib/constants";
import { updateUserSchema, type UpdateUserInput } from "@/lib/validations/auth";
import type { User } from "@/types";

export function UserEditForm({
  user,
  isSelf,
}: {
  user: User;
  isSelf: boolean;
}) {
  const update = useUpdateUser();
  const {
    register,
    control,
    handleSubmit,
    setError,
    reset,
    formState: { errors, isDirty },
  } = useForm<UpdateUserInput>({
    resolver: zodResolver(updateUserSchema),
    defaultValues: {
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      phone: user.phone ?? "",
      isActive: user.isActive,
    },
  });

  const onSubmit = handleSubmit((values) => {
    update.mutate(
      { id: user.id, values },
      {
        onSuccess: () => reset(values),
        onError: (error) => handleFormError(error, setError),
      },
    );
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Details</CardTitle>
        <CardDescription>
          Name, contact details and account status.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={onSubmit} noValidate className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField
              label="First name"
              error={errors.firstName?.message}
              required
            >
              {(field) => <Input {...field} {...register("firstName")} />}
            </FormField>
            <FormField
              label="Last name"
              error={errors.lastName?.message}
              required
            >
              {(field) => <Input {...field} {...register("lastName")} />}
            </FormField>
          </div>
          <FormField label="Email" error={errors.email?.message} required>
            {(field) => (
              <Input type="email" {...field} {...register("email")} />
            )}
          </FormField>
          <FormField label="Phone" error={errors.phone?.message}>
            {(field) => <Input type="tel" {...field} {...register("phone")} />}
          </FormField>

          <Controller
            control={control}
            name="isActive"
            render={({ field }) => (
              <div className="flex items-center justify-between rounded-lg border p-3">
                <div>
                  <p className="text-sm font-medium">Active</p>
                  <p className="text-xs text-muted-foreground">
                    {isSelf
                      ? "You can't deactivate your own account."
                      : "Inactive users can't sign in."}
                  </p>
                </div>
                <Switch
                  checked={field.value}
                  onCheckedChange={field.onChange}
                  disabled={isSelf}
                  aria-label="Active"
                />
              </div>
            )}
          />

          <Button type="submit" disabled={!isDirty || update.isPending}>
            {update.isPending ? (
              <LoaderCircle className="animate-spin" aria-hidden />
            ) : null}
            Save changes
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

export function UserRoleCard({
  user,
  isSelf,
}: {
  user: User;
  isSelf: boolean;
}) {
  const updateRole = useUpdateUserRole();
  const [draft, setDraft] = useState<UserRole | null>(null);
  const role = draft ?? user.role;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Role</CardTitle>
        <CardDescription>
          {isSelf
            ? "You can't change your own role."
            : "Controls which areas of the app this user can open."}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Select
          value={role}
          onValueChange={(value) => setDraft(parseUserRole(value))}
          disabled={isSelf || updateRole.isPending}
        >
          <SelectTrigger aria-label="Role" className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {USER_ROLES.map((value) => (
              <SelectItem key={value} value={value}>
                {USER_ROLE_LABELS[value]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button
          disabled={
            isSelf ||
            draft === null ||
            draft === user.role ||
            updateRole.isPending
          }
          onClick={() =>
            updateRole.mutate(
              { id: user.id, role },
              { onSuccess: () => setDraft(null) },
            )
          }
        >
          {updateRole.isPending ? (
            <LoaderCircle className="animate-spin" aria-hidden />
          ) : null}
          Update role
        </Button>
      </CardContent>
    </Card>
  );
}
