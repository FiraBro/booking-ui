"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { CircleAlert, LoaderCircle } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { FormField } from "@/components/shared/form-field";
import { PasswordInput } from "@/components/shared/password-input";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ROUTES } from "@/config/routes";
import { useResetPassword } from "@/features/auth/hooks/use-reset-password";
import { applyFieldErrors, getErrorMessage } from "@/lib/api/error";
import {
  resetPasswordSchema,
  type ResetPasswordInput,
} from "@/lib/validations/auth";

function InvalidLink() {
  return (
    <Card>
      <CardHeader className="space-y-1 text-center">
        <CardTitle className="text-2xl">Reset link not valid</CardTitle>
        <CardDescription>
          This password reset link is missing or incomplete.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Alert variant="destructive">
          <CircleAlert aria-hidden />
          <AlertTitle>We couldn&apos;t find a reset token</AlertTitle>
          <AlertDescription>
            Request a new link and open it from the email we send you.
          </AlertDescription>
        </Alert>
      </CardContent>
      <CardFooter className="flex-col gap-2">
        <Button asChild className="w-full">
          <Link href={ROUTES.forgotPassword}>Request a new link</Link>
        </Button>
        <Button asChild variant="ghost" className="w-full">
          <Link href={ROUTES.login}>Back to sign in</Link>
        </Button>
      </CardFooter>
    </Card>
  );
}

function ResetPasswordForm({ token }: { token: string }) {
  const router = useRouter();
  const reset = useResetPassword();

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<ResetPasswordInput>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { token, password: "", confirmPassword: "" },
  });

  const busy = reset.isPending || reset.isSuccess;

  const onSubmit = handleSubmit((values) => {
    reset.mutate(values, {
      onSuccess: () => {
        toast.success("Password updated");
        router.replace(`${ROUTES.login}?reset=1`);
      },
      onError: (error) => {
        applyFieldErrors(error, setError);
      },
    });
  });

  return (
    <Card>
      <CardHeader className="space-y-1 text-center">
        <CardTitle className="text-2xl">Choose a new password</CardTitle>
        <CardDescription>
          Your new password must be different from your previous ones.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={onSubmit} noValidate className="space-y-4">
          {reset.isError ? (
            <Alert variant="destructive">
              <AlertDescription>
                {getErrorMessage(reset.error)}
              </AlertDescription>
            </Alert>
          ) : null}

          <FormField
            label="New password"
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
            label="Confirm new password"
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

          <Button type="submit" className="w-full" disabled={busy}>
            {busy ? (
              <LoaderCircle className="animate-spin" aria-hidden />
            ) : null}
            {busy ? "Updating…" : "Update password"}
          </Button>
        </form>
      </CardContent>
      <CardFooter className="justify-center">
        <Link
          href={ROUTES.login}
          className="text-sm font-medium text-primary underline-offset-4 hover:underline"
        >
          Back to sign in
        </Link>
      </CardFooter>
    </Card>
  );
}

function ResetPasswordContent() {
  const token = useSearchParams().get("token")?.trim() ?? "";
  if (!token) return <InvalidLink />;
  return <ResetPasswordForm token={token} />;
}

function ResetPasswordFallback() {
  return (
    <Card aria-busy="true">
      <CardHeader className="items-center space-y-2">
        <Skeleton className="h-7 w-52" />
        <Skeleton className="h-4 w-64" />
      </CardHeader>
      <CardContent className="space-y-4">
        <Skeleton className="h-9 w-full" />
        <Skeleton className="h-9 w-full" />
        <Skeleton className="h-9 w-full" />
      </CardContent>
    </Card>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<ResetPasswordFallback />}>
      <ResetPasswordContent />
    </Suspense>
  );
}
