"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { LoaderCircle, MailPlus } from "lucide-react";
import { Controller, useForm } from "react-hook-form";
import { useState } from "react";
import { z } from "zod";
import { FormField } from "@/components/shared/form-field";
import { notify } from "@/components/shared/toast";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { createInvitation } from "@/features/users/api/invitations.api";
import { USER_ROLE_LABELS } from "@/lib/constants";
import { emailSchema } from "@/lib/validations/auth";
import { StatusBadge } from "@/components/shared/status-badge";

const schema = z.object({
  firstName: z.string().trim().min(1, "First name is required").max(50),
  lastName: z.string().trim().min(1, "Last name is required").max(50),
  email: emailSchema,
  role: z.enum(["staff", "admin"]),
});
type FormValues = z.infer<typeof schema>;

export function InviteStaffForm() {
  const [invitedEmail, setInvitedEmail] = useState("");
  const { register, control, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { firstName: "", lastName: "", email: "", role: "staff" },
  });

  const onSubmit = handleSubmit(async (values) => {
    try {
      await createInvitation(values);
      setInvitedEmail(values.email);
      notify.success("Invitation email initiated", `An invitation was sent to ${values.email}.`);
      reset({ ...values, firstName: "", lastName: "", email: "" });
    } catch (error) {
      notify.apiError(error, "We couldn't send the invitation. Please try again.");
    }
  });

  return (
    <Card className="mx-auto w-full max-w-2xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><MailPlus className="size-5" aria-hidden /> Invite a team member</CardTitle>
        <CardDescription>They’ll receive a secure link to set a password and activate their account.</CardDescription>
      </CardHeader>
      <CardContent>
        {invitedEmail ? (
          <Alert className="mb-5">
            <MailPlus aria-hidden />
            <AlertTitle className="flex flex-wrap items-center gap-2">
              Invitation sent <StatusBadge status="pending" />
            </AlertTitle>
            <AlertDescription>
              An invitation was sent to {invitedEmail}. Their status will remain
              pending until they activate their account.
            </AlertDescription>
          </Alert>
        ) : null}
        <form onSubmit={onSubmit} noValidate className="space-y-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField label="First name" error={errors.firstName?.message} required>
              {(field) => <Input autoComplete="given-name" {...field} {...register("firstName")} />}
            </FormField>
            <FormField label="Last name" error={errors.lastName?.message} required>
              {(field) => <Input autoComplete="family-name" {...field} {...register("lastName")} />}
            </FormField>
          </div>
          <FormField label="Email" error={errors.email?.message} required>
            {(field) => <Input type="email" autoComplete="email" {...field} {...register("email")} />}
          </FormField>
          <FormField label="Role" error={errors.role?.message} required>
            {(field) => <Controller control={control} name="role" render={({ field: roleField }) => (
              <Select value={roleField.value} onValueChange={roleField.onChange}>
                <SelectTrigger id={field.id} className="w-full"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {(["staff", "admin"] as const).map((role) => <SelectItem key={role} value={role}>{USER_ROLE_LABELS[role]}</SelectItem>)}
                </SelectContent>
              </Select>
            )} />}
          </FormField>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? <LoaderCircle className="animate-spin" aria-hidden /> : <MailPlus aria-hidden />}
            {isSubmitting ? "Sending invitation…" : "Send invitation"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
