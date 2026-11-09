"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { LoaderCircle, Send } from "lucide-react";
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
import { Textarea } from "@/components/ui/textarea";
import { useSendNotification } from "@/features/notifications/hooks/use-notification-mutations";
import { handleFormError } from "@/lib/api/form-errors";
import { NOTIFICATION_TYPES } from "@/lib/constants";
import { humanize } from "@/lib/format";
import {
  sendNotificationSchema,
  type SendNotificationInput,
} from "@/lib/validations/auth";

const AUDIENCES = [
  { value: "all", label: "Everyone" },
  { value: "customer", label: "All customers" },
  { value: "staff", label: "All staff" },
  { value: "admin", label: "All administrators" },
  { value: "user", label: "A specific user" },
] as const;

type Audience = (typeof AUDIENCES)[number]["value"];

function isAudience(value: string): value is Audience {
  return AUDIENCES.some((audience) => audience.value === value);
}

export function SendNotificationForm() {
  const send = useSendNotification();
  const [audience, setAudience] = useState<Audience>("all");
  const [userId, setUserId] = useState("");
  const [userError, setUserError] = useState<string | null>(null);

  const {
    register,
    control,
    handleSubmit,
    setError,
    reset,
    formState: { errors },
  } = useForm<SendNotificationInput>({
    resolver: zodResolver(sendNotificationSchema),
    defaultValues: { title: "", message: "", type: "info" },
  });

  const onSubmit = handleSubmit((values) => {
    if (audience === "user" && !userId.trim()) {
      setUserError("Enter the ID of the user to notify.");
      return;
    }
    setUserError(null);

    const payload: SendNotificationInput = {
      ...values,
      userId: audience === "user" ? userId.trim() : undefined,
      role:
        audience === "customer" || audience === "staff" || audience === "admin"
          ? audience
          : undefined,
    };

    send.mutate(
      {
        input: payload,
        audience,
        userId: audience === "user" ? userId.trim() : undefined,
      },
      {
        onSuccess: () => {
          reset();
          setUserId("");
        },
        onError: (error) => handleFormError(error, setError),
      },
    );
  });

  return (
    <Card className="max-w-2xl">
      <CardHeader>
        <CardTitle>Send a notification</CardTitle>
        <CardDescription>
          Notifications appear in the recipient&apos;s bell menu and
          notifications page.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={onSubmit} noValidate className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField label="Audience" required>
              {(field) => (
                <Select
                  value={audience}
                  onValueChange={(value) => {
                    if (isAudience(value)) setAudience(value);
                  }}
                >
                  <SelectTrigger id={field.id} className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {AUDIENCES.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </FormField>

            <FormField label="Type" error={errors.type?.message}>
              {(field) => (
                <Controller
                  control={control}
                  name="type"
                  render={({ field: controller }) => (
                    <Select
                      value={controller.value ?? "info"}
                      onValueChange={controller.onChange}
                    >
                      <SelectTrigger id={field.id} className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {NOTIFICATION_TYPES.map((type) => (
                          <SelectItem key={type} value={type}>
                            {humanize(type)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              )}
            </FormField>
          </div>

          {audience === "user" ? (
            <FormField
              label="User ID"
              error={userError ?? undefined}
              required
              description="Find the ID on the user's page under Users."
            >
              {(field) => (
                <Input
                  value={userId}
                  onChange={(event) => setUserId(event.target.value)}
                  {...field}
                />
              )}
            </FormField>
          ) : null}

          <FormField label="Title" error={errors.title?.message} required>
            {(field) => (
              <Input maxLength={120} {...field} {...register("title")} />
            )}
          </FormField>

          <FormField label="Message" error={errors.message?.message} required>
            {(field) => (
              <Textarea
                rows={4}
                maxLength={1000}
                {...field}
                {...register("message")}
              />
            )}
          </FormField>

          <Button type="submit" disabled={send.isPending}>
            {send.isPending ? (
              <LoaderCircle className="animate-spin" aria-hidden />
            ) : (
              <Send aria-hidden />
            )}
            Send notification
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
