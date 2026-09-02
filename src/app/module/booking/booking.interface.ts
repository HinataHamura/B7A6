import type { BookingStatus } from '../../../generated/prisma/index.js';

export interface ICreateBookingPayload {
  listingId: string;
  moveInDate: Date;
  message?: string;
}

export const BOOKING_STATUS_TRANSITIONS: Record<BookingStatus, BookingStatus[]> = {
  PENDING: ['CONFIRMED', 'REJECTED', 'CANCELLED'],
  CONFIRMED: ['CANCELLED', 'COMPLETED'],
  REJECTED: [],
  CANCELLED: [],
  COMPLETED: [],
};
