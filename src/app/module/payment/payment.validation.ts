import { z } from 'zod';

export const initiatePaymentValidation = z.object({
  body: z.object({
    bookingId: z.string({ required_error: 'Booking id is required' }).uuid(),
    purpose: z.enum(['BOOKING_ADVANCE', 'SECURITY_DEPOSIT'], {
      required_error: 'Payment purpose is required',
    }),
  }),
});
