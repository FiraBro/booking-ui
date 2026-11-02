"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { LoaderCircle } from "lucide-react";
import { Controller, useForm } from "react-hook-form";
import { FormField } from "@/components/shared/form-field";
import { PasswordInput } from "@/components/shared/password-input";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useCreateUser } from "@/features/users/hooks/use-user-mutations";
import { handleFormError } from "@/lib/api/form-errors";
import { USER_ROLES, USER_ROLE_LABELS } from "@/lib/constants";
import { createUserSchema, type CreateUserInput } from "@/lib/validations/auth";

/** Rendered only while open, so the form state is fresh every time. */
export function CreateUserDialog({ onClose }: { onClose: () => void }) {
  const create = useCreateUser();
  const {
    register,
    control,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<CreateUserInput>({
    resolver: zodResolver(createUserSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      role: "customer",
      password: "",
      isActive: true,
    },
  });

  const onSubmit = handleSubmit((values) => {
    create.mutate(values, {
      onSuccess: onClose,
      onError: (error) => handleFormError(error, setError),
    });
  });

  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open && !create.isPending) onClose();
      }}
    >
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>New user</DialogTitle>
          <DialogDescription>
            Create an account and choose what the person can access.
          </DialogDescription>
        </DialogHeader>

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
              <Input
                type="email"
                autoComplete="off"
                {...field}
                {...register("email")}
              />
            )}
          </FormField>

          <FormField label="Phone" error={errors.phone?.message}>
            {(field) => <Input type="tel" {...field} {...register("phone")} />}
          </FormField>

          <FormField label="Role" error={errors.role?.message} required>
            {(field) => (
              <Controller
                control={control}
                name="role"
                render={({ field: controller }) => (
                  <Select
                    value={controller.value}
                    onValueChange={controller.onChange}
                  >
                    <SelectTrigger id={field.id} className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {USER_ROLES.map((role) => (
                        <SelectItem key={role} value={role}>
                          {USER_ROLE_LABELS[role]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            )}
          </FormField>

          <FormField
            label="Temporary password"
            description="At least 8 characters with upper and lower case letters and a number."
            error={errors.password?.message}
            required
          >
            {(field) => (
              <PasswordInput
                autoComplete="new-password"
                {...field}
                {...register("password")}
              />
            )}
          </FormField>

          <Controller
            control={control}
            name="isActive"
            render={({ field }) => (
              <div className="flex items-center justify-between rounded-lg border p-3">
                <div>
                  <p className="text-sm font-medium">Active</p>
                  <p className="text-xs text-muted-foreground">
                    Inactive users can&apos;t sign in.
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

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={create.isPending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={create.isPending}>
              {create.isPending ? (
                <LoaderCircle className="animate-spin" aria-hidden />
              ) : null}
              Create user
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
