"use client";

import { useId, type ReactNode } from "react";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

export interface FieldControlProps {
  id: string;
  "aria-invalid": boolean | undefined;
  "aria-describedby": string | undefined;
}

interface FormFieldProps {
  label: ReactNode;
  error?: string;
  description?: ReactNode;
  required?: boolean;
  id?: string;
  className?: string;
  /** Pass a render function to receive the id and ARIA attributes for the control. */
  children: ReactNode | ((control: FieldControlProps) => ReactNode);
}

export function FormField({
  label,
  error,
  description,
  required,
  id,
  className,
  children,
}: FormFieldProps) {
  const generatedId = useId().replace(/[^a-zA-Z0-9_-]/g, "");
  const fieldId = id ?? `field-${generatedId}`;
  const descriptionId = description ? `${fieldId}-description` : undefined;
  const errorId = error ? `${fieldId}-error` : undefined;
  const describedBy =
    [descriptionId, errorId].filter(Boolean).join(" ") || undefined;

  const control: FieldControlProps = {
    id: fieldId,
    "aria-invalid": error ? true : undefined,
    "aria-describedby": describedBy,
  };

  return (
    <div className={cn("space-y-2", className)}>
      <Label htmlFor={fieldId}>
        {label}
        {required ? (
          <>
            <span aria-hidden="true" className="text-destructive">
              *
            </span>
            <span className="sr-only"> (required)</span>
          </>
        ) : null}
      </Label>
      {typeof children === "function" ? children(control) : children}
      {description ? (
        <p id={descriptionId} className="text-xs text-muted-foreground">
          {description}
        </p>
      ) : null}
      {error ? (
        <p
          id={errorId}
          role="alert"
          className="text-xs font-medium text-destructive"
        >
          {error}
        </p>
      ) : null}
    </div>
  );
}
