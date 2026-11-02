"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { LoaderCircle } from "lucide-react";
import { useForm } from "react-hook-form";
import { FormField } from "@/components/shared/form-field";
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
import { Textarea } from "@/components/ui/textarea";
import { useRefund } from "@/features/payments/hooks/use-payments";
import { handleFormError } from "@/lib/api/form-errors";
import { formatCurrency } from "@/lib/format";
import { refundSchema, type RefundInput } from "@/lib/validations/auth";

interface RefundDialogProps {
  bookingId: string;
  /** Amount that can still be refunded. */
  maxAmount?: number | null;
  currency?: string | null;
  onClose: () => void;
}

/** Rendered only while open, so the form state is fresh every time. */
export function RefundDialog({
  bookingId,
  maxAmount,
  currency,
  onClose,
}: RefundDialogProps) {
  const refund = useRefund();
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<RefundInput>({
    resolver: zodResolver(refundSchema),
    defaultValues: { amount: undefined, reason: "" },
  });

  const onSubmit = handleSubmit((values) => {
    if (maxAmount && values.amount !== undefined && values.amount > maxAmount) {
      setError("amount", {
        type: "max",
        message: `You can refund at most ${formatCurrency(maxAmount, currency)}.`,
      });
      return;
    }
    refund.mutate(
      {
        bookingId,
        input: { amount: values.amount, reason: values.reason || undefined },
      },
      {
        onSuccess: onClose,
        onError: (error) => handleFormError(error, setError),
      },
    );
  });

  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open && !refund.isPending) onClose();
      }}
    >
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Refund payment</DialogTitle>
          <DialogDescription>
            Leave the amount empty to refund the full remaining balance
            {maxAmount ? ` (${formatCurrency(maxAmount, currency)})` : ""}.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={onSubmit} noValidate className="space-y-4">
          <FormField label="Amount (optional)" error={errors.amount?.message}>
            {(field) => (
              <Input
                type="number"
                step="0.01"
                min="0"
                inputMode="decimal"
                {...field}
                {...register("amount", {
                  setValueAs: (value: unknown) =>
                    value === "" || value === null || value === undefined
                      ? undefined
                      : Number(value),
                })}
              />
            )}
          </FormField>

          <FormField label="Reason (optional)" error={errors.reason?.message}>
            {(field) => (
              <Textarea
                rows={3}
                maxLength={500}
                {...field}
                {...register("reason")}
              />
            )}
          </FormField>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={refund.isPending}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="destructive"
              disabled={refund.isPending}
            >
              {refund.isPending ? (
                <LoaderCircle className="animate-spin" aria-hidden />
              ) : null}
              Issue refund
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
