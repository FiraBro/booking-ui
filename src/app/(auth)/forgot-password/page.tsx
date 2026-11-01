"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, LoaderCircle, MailCheck } from "lucide-react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { FormField } from "@/components/shared/form-field";
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
import { ROUTES } from "@/config/routes";
import { useForgotPassword } from "@/features/auth/hooks/use-forgot-password";
import { applyFieldErrors, getErrorMessage } from "@/lib/api/error";
import {
  forgotPasswordSchema,
  type ForgotPasswordInput,
} from "@/lib/validations/auth";

export default function ForgotPasswordPage() {
  const forgot = useForgotPassword();

  const {
    register,
    handleSubmit,
    setError,
    reset,
    formState: { errors },
  } = useForm<ForgotPasswordInput>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: "" },
  });

  const onSubmit = handleSubmit((values) => {
    forgot.mutate(values, {
      onError: (error) => {
        applyFieldErrors(error, setError);
      },
    });
  });

  if (forgot.isSuccess) {
    return (
      <Card>
        <CardHeader className="items-center space-y-3 text-center">
          <span className="flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary">
            <MailCheck className="size-6" aria-hidden />
          </span>
          <CardTitle className="text-2xl">Check your inbox</CardTitle>
          <CardDescription>
            If an account exists for{" "}
            <strong className="text-foreground">
              {forgot.variables?.email}
            </strong>
            , we&apos;ve sent instructions to reset your password.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          <Button asChild className="w-full">
            <Link href={ROUTES.login}>Back to sign in</Link>
          </Button>
          <Button
            type="button"
            variant="ghost"
            className="w-full"
            onClick={() => {
              forgot.reset();
              reset();
            }}
          >
            Use a different email
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="space-y-1 text-center">
        <CardTitle className="text-2xl">Forgot your password?</CardTitle>
        <CardDescription>
          Enter your email and we&apos;ll send you a reset link.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={onSubmit} noValidate className="space-y-4">
          {forgot.isError ? (
            <Alert variant="destructive">
              <AlertDescription>
                {getErrorMessage(forgot.error)}
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
                disabled={forgot.isPending}
                {...field}
                {...register("email")}
              />
            )}
          </FormField>

          <Button type="submit" className="w-full" disabled={forgot.isPending}>
            {forgot.isPending ? (
              <LoaderCircle className="animate-spin" aria-hidden />
            ) : null}
            {forgot.isPending ? "Sending…" : "Send reset link"}
          </Button>
        </form>
      </CardContent>
      <CardFooter className="justify-center">
        <Link
          href={ROUTES.login}
          className="inline-flex items-center gap-1 text-sm font-medium text-primary underline-offset-4 hover:underline"
        >
          <ArrowLeft className="size-4" aria-hidden />
          Back to sign in
        </Link>
      </CardFooter>
    </Card>
  );
}
