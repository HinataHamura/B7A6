import { z } from 'zod';

export const createReviewValidation = z.object({
  body: z.object({
    bookingId: z.string({ required_error: 'Booking id is required' }).uuid(),
    rating: z.number({ required_error: 'Rating is required' }).int().min(1).max(5),
    comment: z.string().max(1000).optional(),
  }),
});
