"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { LoaderCircle } from "lucide-react";
import { useForm } from "react-hook-form";
import { FormField } from "@/components/shared/form-field";
import { PasswordInput } from "@/components/shared/password-input";
import { Button } from "@/components/ui/button";
import { useChangePassword } from "@/features/auth/hooks/use-change-password";
import { handleFormError } from "@/lib/api/form-errors";
import {
  changePasswordSchema,
  type ChangePasswordInput,
} from "@/lib/validations/auth";

export function ChangePasswordForm() {
  const change = useChangePassword();
  const {
    register,
    handleSubmit,
    setError,
    reset,
    formState: { errors },
  } = useForm<ChangePasswordInput>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  const onSubmit = handleSubmit((values) => {
    change.mutate(values, {
      onSuccess: () => reset(),
      onError: (error) => handleFormError(error, setError),
    });
  });

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-4">
      <FormField
        label="Current password"
        error={errors.currentPassword?.message}
        required
      >
        {(field) => (
          <PasswordInput
            autoComplete="current-password"
            {...field}
            {...register("currentPassword")}
          />
        )}
      </FormField>
      <FormField
        label="New password"
        description="At least 8 characters with upper and lower case letters and a number."
        error={errors.newPassword?.message}
        required
      >
        {(field) => (
          <PasswordInput
            autoComplete="new-password"
            {...field}
            {...register("newPassword")}
          />
        )}
      </FormField>
      <FormField
        label="Confirm new password"
        error={errors.confirmPassword?.message}
        required
      >
        {(field) => (
          <PasswordInput
            autoComplete="new-password"
            {...field}
            {...register("confirmPassword")}
          />
        )}
      </FormField>
      <Button type="submit" disabled={change.isPending}>
        {change.isPending ? (
          <LoaderCircle className="animate-spin" aria-hidden />
        ) : null}
        Update password
      </Button>
    </form>
  );
}
