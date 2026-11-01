import { toast } from "sonner";
import { getErrorMessage } from "@/lib/api/error";

interface PromiseMessages<T> {
  loading: string;
  success: string | ((data: T) => string);
  error?: string | ((error: unknown) => string);
}

/**
 * Thin wrapper over sonner so feature code never imports the toast library directly.
 * The <Toaster /> itself is mounted once in src/app/providers.tsx.
 */
export const notify = {
  success(message: string, description?: string) {
    return toast.success(message, { description });
  },
  error(message: string, description?: string) {
    return toast.error(message, { description });
  },
  info(message: string, description?: string) {
    return toast.info(message, { description });
  },
  warning(message: string, description?: string) {
    return toast.warning(message, { description });
  },
  /** Shows the normalised message of an ApiError (or any thrown value). */
  apiError(error: unknown, fallback?: string) {
    return toast.error(getErrorMessage(error, fallback));
  },
  promise<T>(promise: Promise<T>, messages: PromiseMessages<T>) {
    return toast.promise(promise, {
      loading: messages.loading,
      success: messages.success,
      error: messages.error ?? ((error: unknown) => getErrorMessage(error)),
    });
  },
  dismiss(id?: string | number) {
    toast.dismiss(id);
  },
};
