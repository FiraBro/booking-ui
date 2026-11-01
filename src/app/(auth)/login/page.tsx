"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { CircleCheck, LoaderCircle } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { useForm } from "react-hook-form";
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
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { getSafeRedirect, ROUTES } from "@/config/routes";
import { useLogin } from "@/features/auth/hooks/use-login";
import { applyFieldErrors, getErrorMessage } from "@/lib/api/error";
import { loginSchema, type LoginInput } from "@/lib/validations/auth";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const login = useLogin();
  const redirect = searchParams.get("redirect");

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  const notice = searchParams.get("registered")
    ? "Your account was created. Sign in to continue."
    : searchParams.get("reset")
      ? "Your password has been updated. Sign in with your new password."
      : null;

  const busy = login.isPending || login.isSuccess;

  const onSubmit = handleSubmit((values) => {
    login.mutate(values, {
      // 1. Add : any or your specific User type here
      onSuccess: (user) => {
        router.replace(getSafeRedirect(redirect, user.role));
      },
      // 2. Add : any or a specific ApiError type here
      onError: (error) => {
        applyFieldErrors(error, setError);
      },
    });
  });

  const withRedirect = (path: string) =>
    redirect ? `${path}?redirect=${encodeURIComponent(redirect)}` : path;

  return (
    <Card>
      <CardHeader className="space-y-1 text-center">
        <CardTitle className="text-2xl">Welcome back</CardTitle>
        <CardDescription>Sign in to manage your bookings</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={onSubmit} noValidate className="space-y-4">
          {notice ? (
            <Alert>
              <CircleCheck aria-hidden />
              <AlertDescription>{notice}</AlertDescription>
            </Alert>
          ) : null}

          {login.isError ? (
            <Alert variant="destructive">
              <AlertDescription>
                {getErrorMessage(login.error)}
              </AlertDescription>
            </Alert>
          ) : null}

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

          <FormField label="Password" error={errors.password?.message} required>
            {(field) => (
              <PasswordInput
                autoComplete="current-password"
                placeholder="Your password"
                disabled={busy}
                {...field}
                {...register("password")}
              />
            )}
          </FormField>

          <div className="flex justify-end">
            <Link
              href={ROUTES.forgotPassword}
              className="text-sm font-medium text-primary underline-offset-4 hover:underline"
            >
              Forgot password?
            </Link>
          </div>

          <Button type="submit" className="w-full" disabled={busy}>
            {busy ? (
              <LoaderCircle className="animate-spin" aria-hidden />
            ) : null}
            {busy ? "Signing in…" : "Sign in"}
          </Button>
        </form>
      </CardContent>
      <CardFooter className="justify-center text-sm text-muted-foreground">
        <span>
          Don&apos;t have an account?{" "}
          <Link
            href={withRedirect(ROUTES.register)}
            className="font-medium text-primary underline-offset-4 hover:underline"
          >
            Create one
          </Link>
        </span>
      </CardFooter>
    </Card>
  );
}

function LoginFallback() {
  return (
    <Card aria-busy="true">
      <CardHeader className="items-center space-y-2">
        <Skeleton className="h-7 w-40" />
        <Skeleton className="h-4 w-56" />
      </CardHeader>
      <CardContent className="space-y-4">
        <Skeleton className="h-9 w-full" />
        <Skeleton className="h-9 w-full" />
        <Skeleton className="h-9 w-full" />
      </CardContent>
    </Card>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<LoginFallback />}>
      <LoginForm />
    </Suspense>
  );
}
