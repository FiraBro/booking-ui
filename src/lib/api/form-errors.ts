import type { FieldValues, UseFormSetError } from "react-hook-form";
import { toast } from "sonner";
import {
  applyFieldErrors,
  getErrorMessage,
  hasErrorKind,
} from "@/lib/api/error";

/**
 * Mutation errors other than validation errors are already toasted by the global MutationCache handler.
 * Validation errors are not, so forms call this to show them inline and as a toast.
 */
export function handleFormError<T extends FieldValues>(
  error: unknown,
  setError: UseFormSetError<T>,
): void {
  if (!hasErrorKind(error, "validation")) return;
  applyFieldErrors(error, setError);
  toast.error(getErrorMessage(error));
}
