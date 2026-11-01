"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { LoaderCircle } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { Controller, useForm } from "react-hook-form";
import { FormField } from "@/components/shared/form-field";
import { PasswordInput } from "@/components/shared/password-input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { getSafeRedirect, ROUTES } from "@/config/routes";
import { useRegister } from "@/features/auth/hooks/use-register";
import { applyFieldErrors, getErrorMessage } from "@/lib/api/error";
import { registerSchema, type RegisterInput } from "@/lib/validations/auth";

function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const registerAccount = useRegister();
  const redirect = searchParams.get("redirect");

  const {
    register,
    control,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      password: "",
      confirmPassword: "",
      acceptTerms: false,
    },
  });

  const busy = registerAccount.isPending || registerAccount.isSuccess;

  const onSubmit = handleSubmit((values) => {
    registerAccount.mutate(values, {
      onSuccess: (result) => {
        if (result.status === "signed_in") {
          router.replace(getSafeRedirect(redirect, result.user.role));
          return;
        }
        const target = redirect
          ? `${ROUTES.login}?registered=1&redirect=${encodeURIComponent(redirect)}`
          : `${ROUTES.login}?registered=1`;
        router.replace(target);
      },
      onError: (error) => {
        applyFieldErrors(error, setError);
      },
    });
  });

  return (
    <Card>
      <CardHeader className="space-y-1 text-center">
        <CardTitle className="text-2xl">Create your account</CardTitle>
        <CardDescription>
          Book services and manage appointments in one place
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={onSubmit} noValidate className="space-y-4">
          {registerAccount.isError ? (
            <Alert variant="destructive">
              <AlertDescription>
                {getErrorMessage(registerAccount.error)}
              </AlertDescription>
            </Alert>
          ) : null}

          <div className="grid gap-4 sm:grid-cols-2">
            <FormField
              label="First name"
              error={errors.firstName?.message}
              required
            >
              {(field) => (
                <Input
                  autoComplete="given-name"
                  disabled={busy}
                  {...field}
                  {...register("firstName")}
                />
              )}
            </FormField>
            <FormField
              label="Last name"
              error={errors.lastName?.message}
              required
            >
              {(field) => (
                <Input
                  autoComplete="family-name"
                  disabled={busy}
                  {...field}
                  {...register("lastName")}
                />
              )}
            </FormField>
          </div>

          <FormField label="Email" error={errors.email?.message} required>
            {(field) => (
              <Input
                type="email"
                autoComplete="email"
                inputMode="email"
                placeholder="you@example.com"
                disabled={busy}
                {...field}
                {...register("email")}
              />
            )}
          </FormField>

          <FormField
            label="Phone"
            description="Optional. Used for booking reminders."
            error={errors.phone?.message}
          >
            {(field) => (
              <Input
                type="tel"
                autoComplete="tel"
                inputMode="tel"
                placeholder="+1 555 123 4567"
                disabled={busy}
                {...field}
                {...register("phone")}
              />
            )}
          </FormField>

          <FormField
            label="Password"
            description="At least 8 characters with upper and lower case letters and a number."
            error={errors.password?.message}
            required
          >
            {(field) => (
              <PasswordInput
                autoComplete="new-password"
                disabled={busy}
                {...field}
                {...register("password")}
              />
            )}
          </FormField>

          <FormField
            label="Confirm password"
            error={errors.confirmPassword?.message}
            required
          >
            {(field) => (
              <PasswordInput
                autoComplete="new-password"
                disabled={busy}
                {...field}
                {...register("confirmPassword")}
              />
            )}
          </FormField>

          <Controller
            control={control}
            name="acceptTerms"
            render={({ field }) => (
              <div className="space-y-2">
                <div className="flex items-start gap-2">
                  <Checkbox
                    id="acceptTerms"
                    ref={field.ref}
                    checked={field.value}
                    onCheckedChange={(checked) =>
                      field.onChange(checked === true)
                    }
                    onBlur={field.onBlur}
                    disabled={busy}
                    aria-invalid={errors.acceptTerms ? true : undefined}
                    aria-describedby={
                      errors.acceptTerms ? "acceptTerms-error" : undefined
                    }
                    className="mt-0.5"
                  />
                  <Label
                    htmlFor="acceptTerms"
                    className="text-sm font-normal leading-snug"
                  >
                    I agree to the Terms of Service and Privacy Policy.
                  </Label>
                </div>
                {errors.acceptTerms ? (
                  <p
                    id="acceptTerms-error"
                    role="alert"
                    className="text-xs font-medium text-destructive"
                  >
                    {errors.acceptTerms.message}
                  </p>
                ) : null}
              </div>
            )}
          />

          <Button type="submit" className="w-full" disabled={busy}>
            {busy ? (
              <LoaderCircle className="animate-spin" aria-hidden />
            ) : null}
            {busy ? "Creating account…" : "Create account"}
          </Button>
        </form>
      </CardContent>
      <CardFooter className="justify-center text-sm text-muted-foreground">
        <span>
          Already have an account?{" "}
          <Link
            href={
              redirect
                ? `${ROUTES.login}?redirect=${encodeURIComponent(redirect)}`
                : ROUTES.login
            }
            className="font-medium text-primary underline-offset-4 hover:underline"
          >
            Sign in
          </Link>
        </span>
      </CardFooter>
    </Card>
  );
}

function RegisterFallback() {
  return (
    <Card aria-busy="true">
      <CardHeader className="items-center space-y-2">
        <Skeleton className="h-7 w-48" />
        <Skeleton className="h-4 w-64" />
      </CardHeader>
      <CardContent className="space-y-4">
        <Skeleton className="h-9 w-full" />
        <Skeleton className="h-9 w-full" />
        <Skeleton className="h-9 w-full" />
        <Skeleton className="h-9 w-full" />
      </CardContent>
    </Card>
  );
}

export default function RegisterPage() {
  return (
    <Suspense fallback={<RegisterFallback />}>
      <RegisterForm />
    </Suspense>
  );
}
