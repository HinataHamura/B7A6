import { z } from 'zod';

export const updateTenantProfileValidation = z.object({
  body: z.object({
    name: z.string().min(2).max(100).optional(),
    phone: z.string().optional(),
    profilePhoto: z.string().url().optional(),
    bio: z.string().max(1000).optional(),
    dateOfBirth: z.coerce.date().optional(),
    occupation: z.string().max(200).optional(),
    gender: z.enum(['MALE', 'FEMALE', 'ANY']).optional(),
    smoker: z.boolean().optional(),
    hasPets: z.boolean().optional(),
    sleepSchedule: z.enum(['EARLY_BIRD', 'NIGHT_OWL', 'FLEXIBLE']).optional(),
    cleanliness: z.enum(['VERY_TIDY', 'MODERATE', 'RELAXED']).optional(),
    budgetMin: z.number().nonnegative().optional(),
    budgetMax: z.number().nonnegative().optional(),
    preferredAreas: z.array(z.string()).optional(),
  }),
});

export const updateLandlordProfileValidation = z.object({
  body: z.object({
    name: z.string().min(2).max(100).optional(),
    phone: z.string().optional(),
    profilePhoto: z.string().url().optional(),
    bio: z.string().max(1000).optional(),
  }),
});

export const submitVerificationValidation = z.object({
  body: z.object({
    documentUrl: z.string({ required_error: 'Document URL is required' }).url(),
  }),
});
