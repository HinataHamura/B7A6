import { z } from 'zod';

export const sendRoommateRequestValidation = z.object({
  body: z.object({
    receiverId: z.string({ required_error: 'Receiver id is required' }).uuid(),
    listingId: z.string().uuid().optional(),
    message: z.string().max(1000).optional(),
  }),
});

export const respondRoommateRequestValidation = z.object({
  body: z.object({
    status: z.enum(['ACCEPTED', 'DECLINED'], { required_error: 'Status is required' }),
  }),
});
