import { z } from 'zod';

export const createBookingValidation = z.object({
  body: z.object({
    listingId: z.string({ required_error: 'Listing id is required' }).uuid(),
    moveInDate: z.coerce
      .date({ required_error: 'Move-in date is required' })
      .refine((date) => date.getTime() > Date.now(), {
        message: 'Move-in date must be in the future',
      }),
    message: z.string().max(1000).optional(),
  }),
});

export const updateBookingStatusValidation = z.object({
  body: z.object({
    status: z.enum(['CONFIRMED', 'REJECTED', 'CANCELLED', 'COMPLETED'], {
      required_error: 'Status is required',
    }),
  }),
});
