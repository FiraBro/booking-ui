import {
  useMutation,
  useQueryClient,
  type QueryClient,
  type QueryKey,
} from "@tanstack/react-query";
import { notify } from "@/components/shared/toast";
import { bookingsApi } from "@/features/bookings/api/bookings.api";
import {
  BOOKING_STATUS_LABELS,
  queryKeys,
  type BookingStatus,
} from "@/lib/constants";
import type {
  Booking,
  CreateBookingInput,
  PaginatedResponse,
  UpdateBookingInput,
} from "@/types";

type BookingPage = PaginatedResponse<Booking>;

interface Snapshot {
  lists: Array<[QueryKey, BookingPage | undefined]>;
  detailKey: QueryKey;
  detail: Booking | undefined;
}

/** Writes the new status into every cached booking list and the detail entry. Returns the previous state. */
function applyOptimisticStatus(
  queryClient: QueryClient,
  id: string,
  status: BookingStatus,
): Snapshot {
  const detailKey = queryKeys.bookings.detail(id);
  const snapshot: Snapshot = {
    lists: queryClient.getQueriesData<BookingPage>({
      queryKey: queryKeys.bookings.all,
    }),
    detailKey,
    detail: queryClient.getQueryData<Booking>(detailKey),
  };

  queryClient.setQueriesData<BookingPage>(
    { queryKey: queryKeys.bookings.all },
    (old) =>
      old
        ? {
            ...old,
            items: old.items.map((item) =>
              item.id === id ? { ...item, status } : item,
            ),
          }
        : old,
  );
  if (snapshot.detail)
    queryClient.setQueryData<Booking>(detailKey, {
      ...snapshot.detail,
      status,
    });

  return snapshot;
}

function restoreSnapshot(queryClient: QueryClient, snapshot: Snapshot): void {
  snapshot.lists.forEach(([key, data]) => queryClient.setQueryData(key, data));
  if (snapshot.detail)
    queryClient.setQueryData(snapshot.detailKey, snapshot.detail);
}

async function cancelOutgoing(
  queryClient: QueryClient,
  id: string,
): Promise<void> {
  await queryClient.cancelQueries({ queryKey: queryKeys.bookings.all });
  await queryClient.cancelQueries({ queryKey: queryKeys.bookings.detail(id) });
}

function invalidateBookingData(queryClient: QueryClient, id?: string): void {
  void queryClient.invalidateQueries({ queryKey: queryKeys.bookings.all });
  if (id)
    void queryClient.invalidateQueries({
      queryKey: queryKeys.bookings.detail(id),
    });
  void queryClient.invalidateQueries({ queryKey: queryKeys.availability.all });
}

/** Errors are handled by the booking wizard itself (slot conflicts need custom UI), so no global toast. */
export function useCreateBooking() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateBookingInput) => bookingsApi.create(input),
    meta: { silent: true },
    onSuccess: (booking) => {
      queryClient.setQueryData(queryKeys.bookings.detail(booking.id), booking);
      invalidateBookingData(queryClient);
    },
  });
}

export function useUpdateBooking() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (vars: { id: string; input: UpdateBookingInput }) =>
      bookingsApi.update(vars.id, vars.input),
    onSuccess: (booking, vars) => {
      notify.success("Booking updated");
      queryClient.setQueryData(queryKeys.bookings.detail(vars.id), booking);
      invalidateBookingData(queryClient, vars.id);
    },
  });
}

/** Staff/admin status changes via PATCH /bookings/{id}/status, applied optimistically. */
export function useUpdateBookingStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (vars: {
      id: string;
      status: BookingStatus;
      reason?: string;
    }) =>
      bookingsApi.updateStatus(vars.id, {
        status: vars.status,
        reason: vars.reason,
      }),
    onMutate: async (vars) => {
      await cancelOutgoing(queryClient, vars.id);
      return applyOptimisticStatus(queryClient, vars.id, vars.status);
    },
    onError: (_error, _vars, snapshot) => {
      if (snapshot) restoreSnapshot(queryClient, snapshot);
    },
    onSuccess: (_data, vars) => {
      notify.success(
        `Booking marked as ${BOOKING_STATUS_LABELS[vars.status].toLowerCase()}`,
      );
    },
    onSettled: (_data, _error, vars) => {
      invalidateBookingData(queryClient, vars.id);
    },
  });
}

/** Customer cancellation via DELETE /bookings/{id}, applied optimistically. */
export function useCancelBooking() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (vars: { id: string; reason?: string }) =>
      bookingsApi.cancel(vars.id, vars.reason),
    onMutate: async (vars) => {
      await cancelOutgoing(queryClient, vars.id);
      return applyOptimisticStatus(queryClient, vars.id, "cancelled");
    },
    onError: (_error, _vars, snapshot) => {
      if (snapshot) restoreSnapshot(queryClient, snapshot);
    },
    onSuccess: () => {
      notify.success("Booking cancelled");
    },
    onSettled: (_data, _error, vars) => {
      invalidateBookingData(queryClient, vars.id);
    },
  });
}

/** Applies one status to many bookings. Failures do not stop the rest; the result lists both groups. */
export function useBulkUpdateBookingStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (vars: {
      ids: string[];
      status: BookingStatus;
      reason?: string;
    }) => {
      const results = await Promise.allSettled(
        vars.ids.map((id) =>
          bookingsApi.updateStatus(id, {
            status: vars.status,
            reason: vars.reason,
          }),
        ),
      );
      const succeeded: string[] = [];
      const failed: string[] = [];
      results.forEach((result, index) => {
        const id = vars.ids[index];
        if (id === undefined) return;
        if (result.status === "fulfilled") succeeded.push(id);
        else failed.push(id);
      });
      return { succeeded, failed };
    },
    meta: { silent: true },
    onSettled: () => {
      invalidateBookingData(queryClient);
    },
  });
}
