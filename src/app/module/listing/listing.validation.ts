import { z } from 'zod';

const listingTypeEnum = z.enum(['ENTIRE_PLACE', 'PRIVATE_ROOM', 'SHARED_ROOM']);
const listingStatusEnum = z.enum(['DRAFT', 'PUBLISHED', 'UNAVAILABLE', 'ARCHIVED']);
const genderEnum = z.enum(['MALE', 'FEMALE', 'ANY']);

export const createListingValidation = z.object({
  body: z.object({
    title: z.string({ required_error: 'Title is required' }).min(5).max(200),
    description: z.string({ required_error: 'Description is required' }).min(20),
    type: listingTypeEnum,
    rentAmount: z.number({ required_error: 'Rent amount is required' }).positive(),
    securityDeposit: z.number({ required_error: 'Security deposit is required' }).nonnegative(),
    bedrooms: z.number().int().nonnegative(),
    bathrooms: z.number().int().nonnegative(),
    maxOccupants: z.number().int().positive().default(1),
    addressLine: z.string({ required_error: 'Address is required' }).min(5),
    city: z.string({ required_error: 'City is required' }),
    area: z.string({ required_error: 'Area is required' }),
    latitude: z.number({ required_error: 'Latitude is required' }).min(-90).max(90),
    longitude: z.number({ required_error: 'Longitude is required' }).min(-180).max(180),
    amenities: z.array(z.string()).default([]),
    images: z.array(z.string().url()).default([]),
    genderPreference: genderEnum.optional(),
    status: z.enum(['DRAFT', 'PUBLISHED']).optional(),
  }),
});

export const updateListingValidation = z.object({
  body: createListingValidation.shape.body.partial().extend({
    status: listingStatusEnum.optional(),
  }),
});

export const nearbyQueryValidation = z.object({
  query: z.object({
    latitude: z.string({ required_error: 'Latitude is required' }),
    longitude: z.string({ required_error: 'Longitude is required' }),
    radiusKm: z.string().optional(),
  }),
});
