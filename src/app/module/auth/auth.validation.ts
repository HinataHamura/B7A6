import { z } from 'zod';

export const registerValidation = z.object({
  body: z.object({
    name: z.string({ required_error: 'Name is required' }).min(2).max(100),
    email: z.string({ required_error: 'Email is required' }).email('Invalid email address'),
    password: z
      .string({ required_error: 'Password is required' })
      .min(6, 'Password must be at least 6 characters'),
    role: z.enum(['LANDLORD', 'TENANT'], {
      required_error: 'Role is required',
    }),
    phone: z.string().optional(),
  }),
});

export const loginValidation = z.object({
  body: z.object({
    email: z.string({ required_error: 'Email is required' }).email('Invalid email address'),
    password: z.string({ required_error: 'Password is required' }),
  }),
});

export const googleLoginValidation = z.object({
  body: z.object({
    idToken: z.string({ required_error: 'Google ID token is required' }),
    role: z.enum(['LANDLORD', 'TENANT']).optional(),
  }),
});

export const changePasswordValidation = z.object({
  body: z.object({
    oldPassword: z.string({ required_error: 'Old password is required' }),
    newPassword: z.string({ required_error: 'New password is required' }).min(6),
  }),
});

export const refreshTokenValidation = z.object({
  body: z.object({
    refreshToken: z.string({ required_error: 'Refresh token is required' }),
  }),
});
