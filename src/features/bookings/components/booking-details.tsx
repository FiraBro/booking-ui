import React from 'react';

export interface BookingDetailsProps {
  booking: unknown;
  role?: string;
  paymentSection?: React.ReactNode;
}

export const BookingDetails: React.FC<BookingDetailsProps> = () => null;
