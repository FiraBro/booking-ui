"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { LoaderCircle } from "lucide-react";
import { useForm } from "react-hook-form";
import { ErrorState } from "@/components/shared/error-state";
import { FormField } from "@/components/shared/form-field";
import { FormSkeleton } from "@/components/shared/loading-skeleton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  useProfile,
  useUpdateProfile,
} from "@/features/auth/hooks/use-profile";
import { handleFormError } from "@/lib/api/form-errors";
import {
  updateProfileSchema,
  type UpdateProfileInput,
} from "@/lib/validations/auth";
import type { User } from "@/types";

function ProfileFormInner({ user }: { user: User }) {
  const update = useUpdateProfile();
  const {
    register,
    handleSubmit,
    setError,
    reset,
    formState: { errors, isDirty },
  } = useForm<UpdateProfileInput>({
    resolver: zodResolver(updateProfileSchema),
    defaultValues: {
      firstName: user.firstName,
      lastName: user.lastName,
      phone: user.phone ?? "",
    },
  });

  const onSubmit = handleSubmit((values) => {
    update.mutate(values, {
      onSuccess: (saved) =>
        reset({
          firstName: saved.firstName,
          lastName: saved.lastName,
          phone: saved.phone ?? "",
        }),
      onError: (error) => handleFormError(error, setError),
    });
  });

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <FormField
          label="First name"
          error={errors.firstName?.message}
          required
        >
          {(field) => (
            <Input
              autoComplete="given-name"
              {...field}
              {...register("firstName")}
            />
          )}
        </FormField>
        <FormField label="Last name" error={errors.lastName?.message} required>
          {(field) => (
            <Input
              autoComplete="family-name"
              {...field}
              {...register("lastName")}
            />
          )}
        </FormField>
      </div>

      <FormField
        label="Email"
        description="Contact an administrator to change your email address."
      >
        {(field) => (
          <Input type="email" value={user.email} readOnly disabled {...field} />
        )}
      </FormField>

      <FormField label="Phone" error={errors.phone?.message}>
        {(field) => (
          <Input
            type="tel"
            autoComplete="tel"
            inputMode="tel"
            {...field}
            {...register("phone")}
          />
        )}
      </FormField>

      <Button type="submit" disabled={!isDirty || update.isPending}>
        {update.isPending ? (
          <LoaderCircle className="animate-spin" aria-hidden />
        ) : null}
        Save changes
      </Button>
    </form>
  );
}

export function ProfileForm() {
  const profile = useProfile();
  if (profile.isPending) return <FormSkeleton fields={3} />;
  if (profile.isError || !profile.data) {
    return (
      <ErrorState
        error={profile.error}
        onRetry={() => void profile.refetch()}
      />
    );
  }
  return <ProfileFormInner user={profile.data} />;
}
