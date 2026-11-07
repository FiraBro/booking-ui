"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { CheckCircle2, CircleAlert, KeyRound, LoaderCircle } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { FormField } from "@/components/shared/form-field";
import { PasswordInput } from "@/components/shared/password-input";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { acceptInvitation } from "@/features/users/api/invitations.api";
import { getErrorMessage } from "@/lib/api/error";
import { ROUTES } from "@/config/routes";
import { passwordSchema } from "@/lib/validations/auth";

const schema = z.object({
  password: passwordSchema,
  confirmPassword: z.string().min(8, "Please enter at least 8 characters"),
}).refine((values) => values.password === values.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});
type Values = z.infer<typeof schema>;

function SetPasswordContent() {
  const token = useSearchParams().get("token")?.trim() ?? "";
  const router = useRouter();
  const [success, setSuccess] = useState(false);
  const [requestError, setRequestError] = useState("");
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<Values>({
    resolver: zodResolver(schema), defaultValues: { password: "", confirmPassword: "" },
  });

  useEffect(() => {
    if (!success) return;
    const timer = window.setTimeout(() => router.replace(ROUTES.login), 2200);
    return () => window.clearTimeout(timer);
  }, [router, success]);

  const onSubmit = handleSubmit(async ({ password }) => {
    setRequestError("");
    try {
      await acceptInvitation({ token, password });
      setSuccess(true);
    } catch (error) {
      setRequestError(getErrorMessage(error, "This invitation link may have expired or is invalid."));
    }
  });

  if (!token) return (
    <Card>
      <CardHeader className="text-center"><CardTitle>Invitation link unavailable</CardTitle><CardDescription>This link is missing its invitation token.</CardDescription></CardHeader>
      <CardContent><Alert variant="destructive"><CircleAlert aria-hidden /><AlertTitle>Invalid link</AlertTitle><AlertDescription>Ask your administrator to send a new invitation.</AlertDescription></Alert></CardContent>
    </Card>
  );

  if (success) return (
    <Card>
        <CardHeader className="items-center text-center">
        <span className="flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary"><CheckCircle2 className="size-6" aria-hidden /></span>
        <CardTitle>Password created</CardTitle>
        <CardDescription>Your account is ready. Redirecting you to sign in…</CardDescription>
      </CardHeader>
      <CardFooter><Button asChild className="w-full"><Link href={ROUTES.login}>Continue to sign in</Link></Button></CardFooter>
    </Card>
  );

  return (
    <Card>
      <CardHeader className="items-center text-center">
        <span className="flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary"><KeyRound className="size-6" aria-hidden /></span>
        <CardTitle>Create your password</CardTitle>
        <CardDescription>Choose a password with at least 8 characters to activate your account.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={onSubmit} noValidate className="space-y-4">
          {requestError ? <Alert variant="destructive"><CircleAlert aria-hidden /><AlertTitle>Invitation could not be accepted</AlertTitle><AlertDescription>{requestError}</AlertDescription></Alert> : null}
          <FormField label="New password" error={errors.password?.message} required>
            {(field) => <PasswordInput autoComplete="new-password" disabled={isSubmitting} {...field} {...register("password")} />}
          </FormField>
          <FormField label="Confirm password" error={errors.confirmPassword?.message} required>
            {(field) => <PasswordInput autoComplete="new-password" disabled={isSubmitting} {...field} {...register("confirmPassword")} />}
          </FormField>
          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? <LoaderCircle className="animate-spin" aria-hidden /> : null}
            {isSubmitting ? "Setting password…" : "Set password"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

export function SetPasswordForm() {
  return (
    <Suspense fallback={<Card aria-busy="true"><CardContent className="py-8 text-center text-sm text-muted-foreground">Loading invitation…</CardContent></Card>}>
      <SetPasswordContent />
    </Suspense>
  );
}
