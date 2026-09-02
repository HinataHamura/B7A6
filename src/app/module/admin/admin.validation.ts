import { z } from 'zod';

export const updateUserStatusValidation = z.object({
  body: z.object({
    status: z.enum(['ACTIVE', 'BLOCKED'], { required_error: 'Status is required' }),
  }),
});
