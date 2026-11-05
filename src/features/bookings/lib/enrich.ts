import type { Booking, PaginatedResponse, Service } from "@/types";

export function attachService(
  booking: Booking,
  services: Map<string, Service>,
): Booking {
  if (booking.service || !booking.serviceId) return booking;
  const service = services.get(booking.serviceId);
  if (!service) return booking;
  return {
    ...booking,
    service: {
      id: service.id,
      name: service.name,
      durationMinutes: service.durationMinutes,
      price: service.price,
      currency: service.currency,
      imageUrl: service.imageUrl,
    },
    totalPrice: booking.totalPrice ?? service.price,
    currency: booking.currency ?? service.currency,
  };
}

export function attachServices(
  page: PaginatedResponse<Booking>,
  services: Map<string, Service>,
): PaginatedResponse<Booking> {
  return {
    ...page,
    items: page.items.map((booking) => attachService(booking, services)),
  };
}
